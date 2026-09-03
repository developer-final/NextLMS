import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateChangePassword } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/change-password
 * Safely changes or sets password for authenticated user
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thực hiện đổi mật khẩu" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    const hasExistingPassword = Boolean(user.passwordHash);

    // Validate inputs
    const validation = validateChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
      requireCurrentPassword: hasExistingPassword,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Dữ liệu mật khẩu không hợp lệ", field: validation.field },
        { status: 400 }
      );
    }

    // If account already has a password, verify existing password matches
    if (hasExistingPassword && user.passwordHash) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Mật khẩu hiện tại không chính xác", field: "currentPassword" },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: hasExistingPassword
        ? "Đổi mật khẩu thành công"
        : "Thiết lập mật khẩu tài khoản thành công",
    });
  } catch (error: any) {
    console.error("POST /api/user/change-password error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi cập nhật mật khẩu" },
      { status: 500 }
    );
  }
}
