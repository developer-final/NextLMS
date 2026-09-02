import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Mã token đặt lại mật khẩu không hợp lệ." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải có tối thiểu 6 ký tự." },
        { status: 400 }
      );
    }

    const resetToken = await prisma.verificationToken.findUnique({
      where: { token: token.trim() },
    });

    if (!resetToken || resetToken.type !== "PASSWORD_RESET") {
      return NextResponse.json(
        { error: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng." },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      await prisma.verificationToken.delete({
        where: { id: resetToken.id },
      });
      return NextResponse.json(
        {
          error: "Liên kết đặt lại mật khẩu đã hết hạn (15 phút). Vui lòng gửi lại yêu cầu mới.",
          isExpired: true,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản người dùng tương ứng." },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Atomically update password and delete used token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.",
    });
  } catch (error: any) {
    console.error("[Reset Password Error]:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra trong quá trình đặt lại mật khẩu." },
      { status: 500 }
    );
  }
}
