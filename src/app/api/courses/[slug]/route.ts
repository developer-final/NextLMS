import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: {
          select: { id: true, name: true, avatarUrl: true },
        },
        category: {
          select: { name: true, slug: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const isStaff =
      userRole === "ADMIN" ||
      userRole === "SUPER_ADMIN" ||
      (userRole === "INSTRUCTOR" && course.instructorId === userId);

    if (course.status !== "PUBLISHED" && !isStaff) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
