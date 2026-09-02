import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSafeUrl } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const userId = session.user?.id;
    const userRole = session.user?.role;
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

    // Security check 1: Only the order owner or ADMIN/SUPER_ADMIN can upload proof
    if (order.userId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Bạn không có quyền cập nhật biên lai cho đơn hàng này" },
        { status: 403 }
      );
    }

    // Security check 2: Prevent updating cancelled orders
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Đơn hàng này đã bị hủy, không thể gửi biên lai thanh toán" },
        { status: 400 }
      );
    }

    if (!proofImageUrl?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp hình ảnh biên lai chuyển khoản" },
        { status: 400 }
      );
    }

    const trimmedProofUrl = proofImageUrl.trim();

    // Security check 3: Validate against XSS / JavaScript URI injections
    if (!isValidSafeUrl(trimmedProofUrl)) {
      return NextResponse.json(
        { error: "Định dạng đường dẫn ảnh biên lai không hợp lệ hoặc không an toàn" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { orderCode },
      data: {
        proofImageUrl: trimmedProofUrl,
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
