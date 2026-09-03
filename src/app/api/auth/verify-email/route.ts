import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing verification token." },
        { status: 400 }
      );
    }

    const verification = await prisma.verificationToken.findUnique({
      where: { token: token.trim() },
    });

    if (!verification || verification.type !== "EMAIL_VERIFY") {
      return NextResponse.json(
        { error: "Invalid or already used verification link." },
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
          error: "Verification link has expired (24 hours). Please request a new verification email.",
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
        { error: "Associated user account not found." },
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
      message: "Account verified successfully! You can now log in.",
      email: user.email,
    });
  } catch (error: any) {
    console.error("[Verify Email Error]:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying your account." },
      { status: 500 }
    );
  }
}
