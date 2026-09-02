import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json({ error: "Thiếu lessonId" }, { status: 400 });
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
    return NextResponse.json({ error: "Lỗi tải bình luận" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    const userId = session.user.id;
    const { lessonId, content, parentId } = await req.json();

    if (!lessonId || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Nội dung câu hỏi không được để trống" }, { status: 400 });
    }

    // Verify user is enrolled in the course containing this lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { section: { select: { courseId: true } } },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.section.courseId } },
    });

    if (!enrollment || enrollment.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Bạn cần đăng ký khóa học để bình luận" },
        { status: 403 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 2000) {
      return NextResponse.json({ error: "Nội dung bình luận tối đa 2,000 ký tự" }, { status: 400 });
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

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi gửi bình luận" }, { status: 500 });
  }
}
