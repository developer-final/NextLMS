import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const whereClause =
      user.role === "INSTRUCTOR" ? { instructorId: user.id } : {};

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        instructor: { select: { name: true, email: true } },
        category: { select: { id: true, name: true } },
        sections: {
          include: {
            lessons: { select: { id: true } },
          },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, courses });
  } catch (error: any) {
    console.error("Admin Courses GET Error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách khóa học" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, isFeatured } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID khóa học" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(isFeatured);

    const updated = await prisma.course.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật khóa học thành công!",
      course: updated,
    });
  } catch (error: any) {
    console.error("Admin Course PATCH Error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật nhanh khóa học" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID khóa học" }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa khóa học thành công!",
    });
  } catch (error: any) {
    console.error("Admin Course DELETE Error:", error);
    return NextResponse.json({ error: "Lỗi xóa khóa học" }, { status: 500 });
  }
}
