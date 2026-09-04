import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, userIds, courseId } = body;
    const targetUserIds: string[] = Array.isArray(userIds)
      ? userIds
      : userId
      ? [userId]
      : [];

    if (targetUserIds.length === 0 || !courseId) {
      return NextResponse.json({ error: "Missing userId/userIds or courseId" }, { status: 400 });
    }

    let grantedCount = 0;
    for (const uId of targetUserIds) {
      try {
        await prisma.enrollment.upsert({
          where: {
            userId_courseId: { userId: uId, courseId },
          },
          update: {
            status: "ACTIVE",
          },
          create: {
            userId: uId,
            courseId,
            status: "ACTIVE",
            progressPercent: 0,
          },
        });
        grantedCount++;
      } catch (err) {
        console.error(`Error enrolling student ${uId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      count: grantedCount,
      total: targetUserIds.length,
      message: `Access granted successfully to ${grantedCount} students!`,
    });
  } catch (error: any) {
    console.error("Manual Enrollment POST Error:", error);
    return NextResponse.json({ error: "Error granting student access" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
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
      return NextResponse.json({ error: "Missing enrollment info to revoke" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Student access revoked successfully!",
    });
  } catch (error: any) {
    console.error("Manual Enrollment DELETE Error:", error);
    return NextResponse.json({ error: "Error revoking student access" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, userIds, status } = body;
    const targetUserIds: string[] = Array.isArray(userIds)
      ? userIds
      : userId
      ? [userId]
      : [];

    if (targetUserIds.length === 0 || !status) {
      return NextResponse.json({ error: "Missing userId/userIds or status" }, { status: 400 });
    }

    const ALLOWED_USER_STATUSES = ["ACTIVE", "BLOCKED"];
    if (!ALLOWED_USER_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value. Allowed: ACTIVE, BLOCKED" },
        { status: 400 }
      );
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: targetUserIds } },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Student account status updated successfully for ${result.count} students!`,
    });
  } catch (error: any) {
    console.error("Student PATCH Status Error:", error);
    return NextResponse.json({ error: "Error updating student" }, { status: 500 });
  }
}
