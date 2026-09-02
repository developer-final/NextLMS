import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getClientIp, forgotPasswordRateLimiter } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = forgotPasswordRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${waitSeconds} giây.`,
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

    // If user exists and is not verified yet, send a fresh token
    if (user && !user.emailVerified) {
      // Remove any existing verification tokens
      await prisma.verificationToken.deleteMany({
        where: { email: cleanEmail, type: "EMAIL_VERIFY" },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.verificationToken.create({
        data: {
          email: cleanEmail,
          token,
          type: "EMAIL_VERIFY",
          expiresAt,
        },
      });

      sendVerificationEmail({
        to: cleanEmail,
        name: user.name,
        token,
      }).catch((err) => console.error("Error resending verify email:", err));
    }

    // Always respond with a generic success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "Nếu email của bạn chưa được kích hoạt, hệ thống đã gửi lại liên kết kích hoạt tài khoản.",
    });
  } catch (error: any) {
    console.error("[Resend Verification Error]:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi gửi lại email xác thực." },
      { status: 500 }
    );
  }
}
