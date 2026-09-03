import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, commentRateLimiter } from "@/lib/rate-limit";
import { validateCommentInput } from "@/lib/validation";
import { sendQAReplyEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        lessonId,
        parentId: null, // Get top level comments
      },
      include: {
        user: {
          select: { name: true, avatarUrl: true, role: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(comments);
  } catch (error: any) {
    return NextResponse.json({ error: "Error loading comments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limiting check
    const clientIp = getClientIp(req);
    const rateCheck = commentRateLimiter.check(userId || clientIp);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `You are submitting comments too quickly. Please wait ${waitSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { "Retry-After": waitSeconds.toString() },
        }
      );
    }

    const body = await req.json();
    const validation = validateCommentInput(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { lessonId, content, parentId } = body;

    // Verify user is enrolled in the course containing this lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { section: { select: { courseId: true } } },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.section.courseId } },
    });

    const isStaff =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "INSTRUCTOR";

    if (!isStaff && (!enrollment || enrollment.status !== "ACTIVE")) {
      return NextResponse.json(
        { error: "You need to be enrolled in this course to comment" },
        { status: 403 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 2000) {
      return NextResponse.json({ error: "Comment cannot exceed 2000 characters" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        lessonId,
        userId,
        parentId: parentId || null,
        content: trimmedContent,
      },
      include: {
        user: {
          select: { name: true, avatarUrl: true, role: true },
        },
      },
    });

    // Notify original question author if this is a reply
    if (parentId) {
      prisma.comment
        .findUnique({
          where: { id: parentId },
          include: {
            user: true,
            lesson: {
              select: {
                title: true,
                slug: true,
                section: {
                  select: {
                    course: { select: { slug: true } },
                  },
                },
              },
            },
          },
        })
        .then((parentComment) => {
          if (
            parentComment &&
            parentComment.userId !== userId &&
            parentComment.user?.email
          ) {
            sendQAReplyEmail({
              to: parentComment.user.email,
              studentName: parentComment.user.name,
              replierName: session.user.name || "Instructor",
              lessonTitle: parentComment.lesson.title,
              replyContent: trimmedContent,
              courseSlug: parentComment.lesson.section.course.slug,
              lessonSlug: parentComment.lesson.slug,
            }).catch((err) =>
              console.error("[Comments] Error sending QA reply email:", err)
            );
          }
        })
        .catch((err) => console.error("[Comments] Error looking up parent comment:", err));
    }

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    return NextResponse.json({ error: "Error submitting comment" }, { status: 500 });
  }
}
