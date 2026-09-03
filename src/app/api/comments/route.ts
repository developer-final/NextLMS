import { NextResponse, after } from "next/server";
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
    const postId = searchParams.get("postId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10));

    if (!lessonId && !postId) {
      return NextResponse.json(
        { error: "Missing lessonId or postId parameter" },
        { status: 400 }
      );
    }

    if (postId) {
      const whereClause = {
        postId,
        parentId: null,
      };

      const [totalComments, comments] = await Promise.all([
        prisma.comment.count({ where: whereClause }),
        prisma.comment.findMany({
          where: whereClause,
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, role: true },
            },
          },
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(totalComments / pageSize));

      return NextResponse.json({
        comments,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: totalComments,
          totalPages,
        },
      });
    }

    // Default lesson comments (backward compatible array)
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
    console.error("Comments GET Error:", error);
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

    const { lessonId, postId, content, parentId } = body;
    const isStaff =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "INSTRUCTOR";

    // Handle BlogPost comment
    if (postId) {
      const post = await prisma.blogPost.findUnique({
        where: { id: postId },
        select: { id: true, status: true, authorId: true },
      });

      if (!post) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }

      if (post.status !== "PUBLISHED" && !isStaff && post.authorId !== userId) {
        return NextResponse.json(
          { error: "Cannot comment on an unpublished article" },
          { status: 403 }
        );
      }
    } else if (lessonId) {
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

      if (!isStaff && (!enrollment || enrollment.status !== "ACTIVE")) {
        return NextResponse.json(
          { error: "You need to be enrolled in this course to comment" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Target lessonId or postId is required" },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 2000) {
      return NextResponse.json({ error: "Comment cannot exceed 2000 characters" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        lessonId: lessonId || null,
        postId: postId || null,
        userId,
        parentId: parentId || null,
        content: trimmedContent,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    // Notify original question author safely in background if this is a reply on a lesson
    if (parentId && lessonId) {
      after(async () => {
        try {
          const parentComment = await prisma.comment.findUnique({
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
          });

          if (
            parentComment &&
            parentComment.userId !== userId &&
            parentComment.user?.email &&
            parentComment.lesson
          ) {
            await sendQAReplyEmail({
              to: parentComment.user.email,
              studentName: parentComment.user.name,
              replierName: session.user.name || "Instructor",
              lessonTitle: parentComment.lesson.title,
              replyContent: trimmedContent,
              courseSlug: parentComment.lesson.section.course.slug,
              lessonSlug: parentComment.lesson.slug,
            });
          }
        } catch (err) {
          console.error("[Comments] Error sending QA reply email in background:", err);
        }
      });
    }

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error("Comments POST Error:", error);
    return NextResponse.json({ error: "Error submitting comment" }, { status: 500 });
  }
}

