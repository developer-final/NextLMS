import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderCode } from "@/lib/utils";
import { getClientIp, orderRateLimiter } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để tiếp tục thanh toán" },
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
          error: `Bạn đã tạo quá nhiều đơn hàng liên tục. Vui lòng chờ ${waitSeconds} giây trước khi thử lại.`,
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
      return NextResponse.json({ error: "Thiếu thông tin khóa học" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Khóa học không tồn tại hoặc chưa mở bán" }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existingEnrollment && existingEnrollment.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Bạn đã sở hữu khóa học này rồi!", alreadyEnrolled: true },
        { status: 400 }
      );
    }

    // Calculate pricing and validate coupon preliminary data
    const originalPrice = course.salePrice !== null ? course.salePrice : course.price;
    let discountAmount = 0;
    let validCouponId: string | null = null;

    if (couponCode) {
      const cleanCouponCode = couponCode.toUpperCase().trim();
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCouponCode },
      });

      if (!coupon || !coupon.isActive) {
        return NextResponse.json(
          { error: "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa" },
          { status: 400 }
        );
      }

      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return NextResponse.json(
          { error: "Mã giảm giá đã hết hạn sử dụng" },
          { status: 400 }
        );
      }

      if (coupon.usedCount >= coupon.maxUsage) {
        return NextResponse.json(
          { error: "Mã giảm giá đã hết lượt sử dụng" },
          { status: 400 }
        );
      }

      if (originalPrice < coupon.minOrderValue) {
        return NextResponse.json(
          { error: `Đơn hàng tối thiểu để áp dụng mã là ${coupon.minOrderValue.toLocaleString("vi-VN")}đ` },
          { status: 400 }
        );
      }

      validCouponId = coupon.id;
      if (coupon.discountType === "PERCENT") {
        discountAmount = (originalPrice * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }
    }

    const finalAmount = Math.max(0, originalPrice - discountAmount);
    const orderCode = generateOrderCode();
    const isFreeOrder = course.isFree || finalAmount === 0;

    // Use Prisma transaction with strict concurrency check on coupon count
    const order = await prisma.$transaction(async (tx) => {
      if (validCouponId) {
        const couponToUse = await tx.coupon.findUnique({
          where: { id: validCouponId },
        });

        if (!couponToUse || !couponToUse.isActive || couponToUse.usedCount >= couponToUse.maxUsage) {
          throw new Error("COUPON_LIMIT_EXCEEDED");
        }

        await tx.coupon.update({
          where: { id: validCouponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      const createdOrder = await tx.order.create({
        data: {
          orderCode,
          userId,
          totalAmount: originalPrice,
          discountAmount,
          finalAmount,
          paymentMethod: isFreeOrder ? "FREE" : paymentMethod || "BANK_TRANSFER_MANUAL",
          status: isFreeOrder ? "COMPLETED" : "PENDING",
          orderItems: {
            create: {
              courseId: course.id,
              price: finalAmount,
            },
          },
        },
      });

      // If Free -> Auto activate Enrollment inside transaction
      if (isFreeOrder) {
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
        ? "Đăng ký khóa học thành công!"
        : "Tạo đơn hàng thành công!",
    });
  } catch (error: any) {
    if (error?.message === "COUPON_LIMIT_EXCEEDED") {
      return NextResponse.json(
        { error: "Mã giảm giá vừa hết lượt sử dụng. Vui lòng kiểm tra lại." },
        { status: 400 }
      );
    }
    console.error("Order Creation Error:", error);
    return NextResponse.json(
      { error: "Không thể tạo đơn hàng. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
