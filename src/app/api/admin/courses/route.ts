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
    const { id, ids, status, isFeatured } = body;

    const targetIds: string[] = Array.isArray(ids)
      ? ids.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : id ? [id] : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "Missing course ID or IDs" }, { status: 400 });
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

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    if (targetIds.length === 1) {
      const updated = await prisma.course.update({
        where: { id: targetIds[0] },
        data: dataToUpdate,
      });

      return NextResponse.json({
        success: true,
        message: "Course updated successfully!",
        course: updated,
      });
    } else {
      const result = await prisma.course.updateMany({
        where: { id: { in: targetIds } },
        data: dataToUpdate,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${result.count} courses!`,
        count: result.count,
      });
    }
  } catch (error: any) {
    console.error("Admin Course PATCH Error:", error);
    return NextResponse.json({ error: "Error updating course(s)" }, { status: 500 });
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
    const queryId = searchParams.get("id");
    const queryIds = searchParams.get("ids");

    let targetIds: string[] = [];
    if (queryId) {
      targetIds = [queryId];
    } else if (queryIds) {
      targetIds = queryIds.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      try {
        const body = await req.json();
        if (Array.isArray(body?.ids)) {
          targetIds = body.ids.filter((item: any): item is string => typeof item === "string" && item.trim().length > 0);
        } else if (body?.id) {
          targetIds = [body.id];
        }
      } catch {
        // No JSON body provided
      }
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "Missing course ID or IDs" }, { status: 400 });
    }

    // Check if any courses have existing order items
    const existingOrders = await prisma.orderItem.findMany({
      where: { courseId: { in: targetIds } },
      select: { courseId: true },
    });
    const coursesWithOrders = new Set(existingOrders.map((o) => o.courseId));
    const deletableIds = targetIds.filter((id) => !coursesWithOrders.has(id));

    if (deletableIds.length === 0) {
      return NextResponse.json(
        {
          error: "All selected courses have associated orders and cannot be deleted directly to preserve financial records.",
          coursesWithOrders: Array.from(coursesWithOrders),
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      deletableIds.map((id) =>
        prisma.course.delete({
          where: { id },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletableIds.length} course(s)!`,
      deletedCount: deletableIds.length,
      skippedCount: coursesWithOrders.size,
    });
  } catch (error: any) {
    console.error("Admin Course DELETE Error:", error);
    return NextResponse.json({ error: "Error deleting course(s)" }, { status: 500 });
  }
}
