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
    console.error("Manual Enrollment Error:", error);
    return NextResponse.json({ error: "Lỗi cấp quyền học viên" }, { status: 500 });
  }
}
