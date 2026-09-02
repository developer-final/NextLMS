import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getClientIp, forgotPasswordRateLimiter } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = forgotPasswordRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${waitSeconds} giây.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Địa chỉ email không hợp lệ." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // If user exists, create secure 15-minute token
    if (user && user.status !== "BLOCKED") {
      // Clean up previous reset tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { email: cleanEmail, type: "PASSWORD_RESET" },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.verificationToken.create({
        data: {
          email: cleanEmail,
          token,
          type: "PASSWORD_RESET",
          expiresAt,
        },
      });

      sendPasswordResetEmail({
        to: cleanEmail,
        name: user.name,
        token,
      }).catch((err) => {
        console.error("[ForgotPassword] Failed to send reset email:", err);
      });
    }

    // Generic response to prevent user enumeration
    return NextResponse.json({
      success: true,
      message:
        "Nếu địa chỉ email tồn tại trên hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu về hộp thư của bạn.",
    });
  } catch (error: any) {
    console.error("[Forgot Password Error]:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xử lý yêu cầu đặt lại mật khẩu." },
      { status: 500 }
    );
  }
}
