import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }

    const { orderId, action } = await req.json(); // action: 'APPROVE' | 'CANCEL'

    if (!orderId) {
      return NextResponse.json({ error: "Thiếu orderId" }, { status: 400 });
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

    if (action === "CANCEL") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ success: true, message: "Đã hủy đơn hàng" });
    }

    // Action: APPROVE
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });

    // Create Enrollment for each course in order
    for (const item of order.orderItems) {
      await prisma.enrollment.upsert({
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

    return NextResponse.json({
      success: true,
      message: "Duyệt đơn hàng và kích hoạt khóa học thành công!",
    });
  } catch (error: any) {
    console.error("Approve Order Error:", error);
    return NextResponse.json({ error: "Lỗi xử lý duyệt đơn hàng" }, { status: 500 });
  }
}
