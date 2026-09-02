import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { orderCode } = await params;
    const userId = session.user?.id;
    const userRole = session.user?.role;

    if (!orderCode) {
      return NextResponse.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: {
        id: true,
        orderCode: true,
        status: true,
        userId: true,
        finalAmount: true,
        createdAt: true,
        updatedAt: true,
        orderItems: {
          select: {
            course: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    // Security check: Only owner or admin
    if (order.userId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      orderCode: order.orderCode,
      status: order.status,
      isCompleted: order.status === "COMPLETED",
      courseSlug: order.orderItems[0]?.course?.slug || null,
      courseTitle: order.orderItems[0]?.course?.title || null,
    });
  } catch (error: any) {
    console.error("Check Order Status Error:", error);
    return NextResponse.json({ error: "Lỗi kiểm tra trạng thái đơn hàng" }, { status: 500 });
  }
}
