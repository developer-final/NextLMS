import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ Tên, Email và Mật khẩu" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Định dạng email không hợp lệ" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký trên hệ thống" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if this is the first user in system -> make ADMIN, otherwise STUDENT
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "STUDENT";

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
          name
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

    return NextResponse.json(
      {
        message: "Đăng ký tài khoản thành công!",
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
