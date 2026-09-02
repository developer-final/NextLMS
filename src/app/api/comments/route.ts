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

    const userId = (session.user as any).id;
    const { lessonId, content, parentId } = await req.json();

    if (!lessonId || !content?.trim()) {
      return NextResponse.json({ error: "Nội dung câu hỏi không được để trống" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        lessonId,
        userId,
        parentId: parentId || null,
        content: content.trim(),
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
