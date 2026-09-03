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
    return NextResponse.json({ error: "Error loading courses" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing course ID" }, { status: 400 });
    }

    const ALLOWED_COURSE_STATUSES = ["PUBLISHED", "DRAFT", "ARCHIVED"];
    if (status !== undefined && !ALLOWED_COURSE_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid course status. Allowed: PUBLISHED, DRAFT, ARCHIVED" },
        { status: 400 }
      );
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
      message: "Course updated successfully!",
      course: updated,
    });
  } catch (error: any) {
    console.error("Admin Course PATCH Error:", error);
    return NextResponse.json({ error: "Error updating course" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing course ID" }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully!",
    });
  } catch (error: any) {
    console.error("Admin Course DELETE Error:", error);
    return NextResponse.json({ error: "Error deleting course" }, { status: 500 });
  }
}
