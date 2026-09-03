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
          error: `You are submitting requests too quickly. Please try again after ${waitSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
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
        "If that email address exists in our system, password reset instructions have been sent to your inbox.",
    });
  } catch (error: any) {
    console.error("[Forgot Password Error]:", error);
    return NextResponse.json(
      { error: "An error occurred while processing password reset request." },
      { status: 500 }
    );
  }
}
