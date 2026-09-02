import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderCode } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để tiếp tục thanh toán" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
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

    const originalPrice = course.salePrice !== null ? course.salePrice : course.price;
    let discountAmount = 0;

    // Process coupon if any
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });

      if (coupon && coupon.isActive) {
        if (coupon.discountType === "PERCENT") {
          discountAmount = (originalPrice * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }

        // Increment usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const finalAmount = Math.max(0, originalPrice - discountAmount);
    const orderCode = generateOrderCode();

    // Check if Course is FREE or Final Amount is 0
    const isFreeOrder = course.isFree || finalAmount === 0;

    const order = await prisma.order.create({
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

    // If Free -> Auto activate Enrollment!
    if (isFreeOrder) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { status: "ACTIVE" },
        create: {
          userId,
          courseId,
          status: "ACTIVE",
          progressPercent: 0,
        },
      });

      return NextResponse.json({
        success: true,
        order,
        isFreeOrder: true,
        message: "Đăng ký khóa học thành công!",
      });
    }

    return NextResponse.json({
      success: true,
      order,
      isFreeOrder: false,
      message: "Tạo đơn hàng thành công!",
    });
  } catch (error: any) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ error: "Không thể tạo đơn hàng. Vui lòng thử lại." }, { status: 500 });
  }
}
