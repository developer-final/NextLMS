import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid password reset token." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const resetToken = await prisma.verificationToken.findUnique({
      where: { token: token.trim() },
    });

    if (!resetToken || resetToken.type !== "PASSWORD_RESET") {
      return NextResponse.json(
        { error: "Invalid or already used password reset link." },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      await prisma.verificationToken.delete({
        where: { id: resetToken.id },
      });
      return NextResponse.json(
        {
          error: "Password reset link has expired (15 minutes). Please submit a new request.",
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
        { error: "Corresponding user account not found." },
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
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("[Reset Password Error]:", error);
    return NextResponse.json(
      { error: "An error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
