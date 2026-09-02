import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }

    const { orderId, action } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Thiếu orderId" }, { status: 400 });
    }

    // Strict action validation
    if (action !== "APPROVE" && action !== "CANCEL") {
      return NextResponse.json(
        { error: "Thao tác không hợp lệ. Chỉ chấp nhận APPROVE hoặc CANCEL." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    // State machine check
    if (action === "APPROVE") {
      if (order.status === "COMPLETED") {
        return NextResponse.json(
          { error: "Đơn hàng này đã được duyệt trước đó." },
          { status: 400 }
        );
      }
      if (order.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Không thể duyệt đơn hàng đã bị hủy." },
          { status: 400 }
        );
      }

      // Execute approval atomically
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "COMPLETED" },
        });

        // If order used a coupon, increment coupon's usedCount now upon approval
        if (order.couponId) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // Create Enrollment for each course in order
        for (const item of order.orderItems) {
          await tx.enrollment.upsert({
            where: {
              userId_courseId: {
                userId: order.userId,
                courseId: item.courseId,
              },
            },
            update: {
              status: "ACTIVE",
            },
            create: {
              userId: order.userId,
              courseId: item.courseId,
              status: "ACTIVE",
              progressPercent: 0,
            },
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: "Duyệt đơn hàng và kích hoạt khóa học thành công!",
      });
    }

    if (action === "CANCEL") {
      if (order.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Đơn hàng này đã bị hủy trước đó." },
          { status: 400 }
        );
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({ success: true, message: "Đã hủy đơn hàng" });
    }

    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    console.error("Approve Order Error:", error);
    return NextResponse.json({ error: "Lỗi xử lý duyệt đơn hàng" }, { status: 500 });
  }
}
