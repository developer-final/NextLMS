import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderCode } from "@/lib/utils";
import { getClientIp, orderRateLimiter } from "@/lib/rate-limit";
import { validateCoupon, calculateOrderPricing } from "@/lib/billing";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Please log in to proceed with checkout" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 1. Rate Limiting check
    const clientIp = getClientIp(req);
    const rateCheck = orderRateLimiter.check(userId || clientIp);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Too many order creation requests. Please wait ${waitSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { "Retry-After": waitSeconds.toString() },
        }
      );
    }

    const body = await req.json();
    const { courseId, couponCode, paymentMethod } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Missing required courseId" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Course not found or has not been published" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existingEnrollment && existingEnrollment.status === "ACTIVE") {
      return NextResponse.json(
        { error: "You already own this course!", alreadyEnrolled: true },
        { status: 400 }
      );
    }

    // Calculate pricing using standardized billing library
    const originalPrice = Number(
      course.salePrice !== null ? course.salePrice : course.price
    );
    let validCouponId: string | null = null;
    let validCouponData: any = null;

    if (couponCode) {
      const cleanCouponCode = couponCode.toUpperCase().trim();
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCouponCode },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: "Coupon does not exist or has been disabled" },
          { status: 400 }
        );
      }

      const couponObj = {
        ...coupon,
        discountValue: Number(coupon.discountValue),
        minOrderValue: Number(coupon.minOrderValue),
      };

      const validation = validateCoupon(couponObj, originalPrice);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || "Invalid coupon code" },
          { status: 400 }
        );
      }

      validCouponId = coupon.id;
      validCouponData = couponObj;
    }

    const pricing = calculateOrderPricing(originalPrice, validCouponData);
    const finalAmount = pricing.finalAmount;
    const discountAmount = pricing.discountAmount;
    const orderCode = generateOrderCode();
    const isFreeOrder = course.isFree || finalAmount === 0;

    // Check if there is an active PENDING order created within the last 30 minutes with identical pricing
    if (!isFreeOrder) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const existingPendingOrder = await prisma.order.findFirst({
        where: {
          userId,
          status: "PENDING",
          createdAt: { gte: thirtyMinutesAgo },
          orderItems: {
            some: { courseId: course.id },
          },
          finalAmount,
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingPendingOrder) {
        // Reuse existing order and update payment method if changed
        const updatedOrder = await prisma.order.update({
          where: { id: existingPendingOrder.id },
          data: {
            paymentMethod: paymentMethod || existingPendingOrder.paymentMethod,
            couponId: validCouponId,
            discountAmount,
          },
        });

        return NextResponse.json({
          success: true,
          order: updatedOrder,
          isFreeOrder: false,
          reused: true,
          message: "Order ready. Please complete payment.",
        });
      }
    }

    // Use Prisma transaction with strict concurrency check on coupon count
    const order = await prisma.$transaction(async (tx) => {
      if (validCouponId) {
        const couponToUse = await tx.coupon.findUnique({
          where: { id: validCouponId },
        });

        if (
          !couponToUse ||
          !couponToUse.isActive ||
          couponToUse.usedCount >= couponToUse.maxUsage
        ) {
          throw new Error("COUPON_LIMIT_EXCEEDED");
        }

        // Only increment usedCount immediately if the order completes immediately (Free order)
        if (isFreeOrder) {
          await tx.coupon.update({
            where: { id: validCouponId },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          orderCode,
          userId,
          couponId: validCouponId,
          totalAmount: originalPrice,
          discountAmount,
          finalAmount,
          paymentMethod: isFreeOrder
            ? "FREE"
            : paymentMethod || "BANK_TRANSFER_MANUAL",
          status: isFreeOrder ? "COMPLETED" : "PENDING",
          orderItems: {
            create: {
              courseId: course.id,
              price: originalPrice,
            },
          },
        },
      });

      // If Free -> Auto activate Enrollment and create audit Transaction record
      if (isFreeOrder) {
        await tx.transaction.create({
          data: {
            orderId: createdOrder.id,
            gatewayRef: `FREE-ENROLL-${Date.now()}`,
            bankCode: "FREE",
            transferContent: "Free course enrollment",
            amount: 0,
            rawWebhookData: JSON.stringify({
              enrolledAt: new Date().toISOString(),
            }),
          },
        });

        await tx.enrollment.upsert({
          where: { userId_courseId: { userId, courseId } },
          update: { status: "ACTIVE" },
          create: {
            userId,
            courseId,
            status: "ACTIVE",
            progressPercent: 0,
          },
        });
      }

      return createdOrder;
    });

    return NextResponse.json({
      success: true,
      order,
      isFreeOrder,
      message: isFreeOrder
        ? "Course enrollment successful!"
        : "Order created successfully!",
    });
  } catch (error: any) {
    if (error?.message === "COUPON_LIMIT_EXCEEDED") {
      return NextResponse.json(
        { error: "Coupon usage limit has been reached. Please try another coupon." },
        { status: 400 }
      );
    }
    console.error("Order Creation Error:", error);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
