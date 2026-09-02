import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { lessonId, courseId } = await req.json();

    if (!lessonId || !courseId) {
      return NextResponse.json({ error: "Thiếu tham số" }, { status: 400 });
    }

    // Security Check: Verify user is actively enrolled in the course
    const activeEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!activeEnrollment || activeEnrollment.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Bạn chưa đăng ký hoặc chưa được kích hoạt khóa học này." },
        { status: 403 }
      );
    }

    // 1. Mark lesson progress as completed
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // 2. Count total lessons in course
    const totalLessons = await prisma.lesson.count({
      where: {
        section: { courseId },
      },
    });

    // 3. Count completed lessons by user in this course
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        isCompleted: true,
        lesson: {
          section: { courseId },
        },
      },
    });

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // 4. Update Enrollment
    const enrollment = await prisma.enrollment.update({
      where: {
        userId_courseId: { userId, courseId },
      },
      data: {
        progressPercent,
        completedAt: progressPercent >= 100 ? new Date() : null,
      },
    });

    // 5. Generate Certificate if 100%
    let certificate = null;
    if (progressPercent >= 100) {
      const existingCert = await prisma.certificate.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      if (!existingCert) {
        const certCode = `CERT-${Date.now().toString().slice(-6)}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;
        certificate = await prisma.certificate.create({
          data: {
            certificateCode: certCode,
            userId,
            courseId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      progressPercent,
      isCompleted100: progressPercent >= 100,
      certificate,
    });
  } catch (error: any) {
    console.error("Progress Complete Error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật tiến độ" }, { status: 500 });
  }
}
