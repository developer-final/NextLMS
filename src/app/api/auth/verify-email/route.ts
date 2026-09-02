import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Mã xác thực không hợp lệ hoặc bị thiếu." },
        { status: 400 }
      );
    }

    const verification = await prisma.verificationToken.findUnique({
      where: { token: token.trim() },
    });

    if (!verification || verification.type !== "EMAIL_VERIFY") {
      return NextResponse.json(
        { error: "Liên kết xác thực không hợp lệ hoặc đã được sử dụng." },
        { status: 400 }
      );
    }

    if (new Date() > verification.expiresAt) {
      // Token expired - clean it up
      await prisma.verificationToken.delete({
        where: { id: verification.id },
      });
      return NextResponse.json(
        {
          error: "Liên kết xác thực đã hết hạn (24 giờ). Vui lòng yêu cầu gửi lại email xác thực mới.",
          isExpired: true,
        },
        { status: 400 }
      );
    }

    // Activate user email
    const user = await prisma.user.findUnique({
      where: { email: verification.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin tài khoản liên kết." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { id: verification.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Kích hoạt tài khoản thành công! Bây giờ bạn có thể đăng nhập.",
      email: user.email,
    });
  } catch (error: any) {
    console.error("[Verify Email Error]:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình kích hoạt tài khoản." },
      { status: 500 }
    );
  }
}
