import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStudyReminderEmail } from "@/lib/email";

export async function GET(req: Request) {
  return handleCronReminders(req);
}

export async function POST(req: Request) {
  return handleCronReminders(req);
}

async function handleCronReminders(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET?.trim();

    // Secure authentication check
    const querySecret = searchParams.get("secret") || searchParams.get("key");
    const bearerSecret = authHeader?.replace(/^Bearer\s+/i, "");
    const providedSecret = bearerSecret || querySecret;

    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    // Find active students with inactive progress for >= 5 days
    const inactiveEnrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        progressPercent: { lt: 100 },
        updatedAt: { lt: fiveDaysAgo },
        OR: [
          { lastStudyReminderSentAt: null },
          { lastStudyReminderSentAt: { lt: fiveDaysAgo } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { title: true, slug: true } },
      },
      take: 20, // Process in safe batches
    });

    let sentCount = 0;

    for (const enrollment of inactiveEnrollments) {
      if (!enrollment.user?.email) continue;

      try {
        await sendStudyReminderEmail({
          to: enrollment.user.email,
          studentName: enrollment.user.name,
          courseTitle: enrollment.course.title,
          progressPercent: enrollment.progressPercent,
          courseSlug: enrollment.course.slug,
        });

        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { lastStudyReminderSentAt: new Date() },
        });

        sentCount++;
      } catch (sendErr) {
        console.error(
          `[Cron Reminder] Failed to send reminder for enrollment ${enrollment.id}:`,
          sendErr
        );
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: sentCount,
      totalMatched: inactiveEnrollments.length,
      message: `Đã gửi ${sentCount} email nhắc nhở giữ nhịp học tập thành công.`,
    });
  } catch (error: any) {
    console.error("[Cron Reminder Error]:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý gửi email nhắc nhở học tập" },
      { status: 500 }
    );
  }
}
