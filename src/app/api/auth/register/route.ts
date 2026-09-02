import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateRegisterInput } from "@/lib/validation";
import { getClientIp, registerRateLimiter } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting check
    const clientIp = getClientIp(req);
    const rateCheck = registerRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Bạn đã gửi quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau ${waitSeconds} giây.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": waitSeconds.toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { name, email, password } = body;

    // 2. Comprehensive Input Validation
    const validation = validateRegisterInput({ name, email, password });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // 3. Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký trên hệ thống" },
        { status: 409 }
      );
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const isStrictVerify = process.env.REQUIRE_EMAIL_VERIFICATION === "true";

    // 5. Atomic user creation and verification token generation
    const { newUser, verificationToken } = await prisma.$transaction(async (tx) => {
      const userCount = await tx.user.count();
      const role = userCount === 0 ? "ADMIN" : "STUDENT";

      const createdUser = await tx.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          role,
          emailVerified: isStrictVerify ? null : new Date(),
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
            cleanName
          )}`,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      // Generate verification token (valid for 24 hours)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await tx.verificationToken.create({
        data: {
          email: cleanEmail,
          token,
          type: "EMAIL_VERIFY",
          expiresAt,
        },
      });

      return { newUser: createdUser, verificationToken: token };
    });

    // Send verification email in background
    sendVerificationEmail({
      to: cleanEmail,
      name: cleanName,
      token: verificationToken,
    }).catch((err) => {
      console.error("[Register] Failed to send verification email:", err);
    });

    const responseMessage = isStrictVerify
      ? "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản trước khi đăng nhập."
      : "Đăng ký tài khoản thành công!";

    return NextResponse.json(
      {
        message: responseMessage,
        requiresVerification: isStrictVerify,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
