import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;
    const { orderCode, proofImageUrl } = await req.json();

    if (!orderCode) {
      return NextResponse.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderCode },
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    // Security check: Only the order owner or ADMIN/SUPER_ADMIN can upload proof
    if (order.userId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Bạn không có quyền cập nhật biên lai cho đơn hàng này" },
        { status: 403 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { orderCode },
      data: {
        proofImageUrl: proofImageUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã gửi xác nhận chuyển khoản thành công! Ban quản trị sẽ duyệt trong ít phút.",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Upload Proof Error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật biên lai thanh toán" }, { status: 500 });
  }
}
