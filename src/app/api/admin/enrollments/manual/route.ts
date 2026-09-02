import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }

    const { userId, courseId } = await req.json();

    if (!userId || !courseId) {
      return NextResponse.json({ error: "Thiếu userId hoặc courseId" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: { userId, courseId },
      },
      update: {
        status: "ACTIVE",
      },
      create: {
        userId,
        courseId,
        status: "ACTIVE",
        progressPercent: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cấp quyền học thành công cho học viên!",
      enrollment,
    });
  } catch (error: any) {
    console.error("Manual Enrollment POST Error:", error);
    return NextResponse.json({ error: "Lỗi cấp quyền học viên" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get("id");
    const userId = searchParams.get("userId");
    const courseId = searchParams.get("courseId");

    if (enrollmentId) {
      await prisma.enrollment.delete({
        where: { id: enrollmentId },
      });
    } else if (userId && courseId) {
      await prisma.enrollment.delete({
        where: {
          userId_courseId: { userId, courseId },
        },
      });
    } else {
      return NextResponse.json({ error: "Thiếu thông tin đăng ký để thu hồi" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Đã thu hồi quyền học của học viên thành công!",
    });
  } catch (error: any) {
    console.error("Manual Enrollment DELETE Error:", error);
    return NextResponse.json({ error: "Lỗi thu hồi quyền học" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "Thiếu userId hoặc status" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật trạng thái tài khoản thành công!",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Student PATCH Status Error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật học viên" }, { status: 500 });
  }
}
