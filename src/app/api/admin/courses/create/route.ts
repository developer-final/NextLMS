import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { validateCourseInput } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }

    const body = await req.json();
    const validation = validateCourseInput(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      title,
      categoryId,
      shortDescription,
      description,
      thumbnailUrl,
      introVideoUrl,
      price,
      salePrice,
      level,
      isFree,
      isFeatured,
      sections,
    } = body;

    const slug = slugify(title) + "-" + Date.now().toString().slice(-4);

    const course = await prisma.course.create({
      data: {
        instructorId: user.id,
        categoryId: categoryId || null,
        title: title.trim(),
        slug,
        shortDescription,
        description,
        thumbnailUrl:
          thumbnailUrl ||
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
        introVideoUrl,
        price: isFree ? 0 : parseFloat(price) || 0,
        salePrice: isFree ? 0 : salePrice ? parseFloat(salePrice) : null,
        level: level || "ALL_LEVELS",
        status: "PUBLISHED",
        isFree: Boolean(isFree),
        isFeatured: Boolean(isFeatured),
        certificateEnabled: true,
        // Create Sections & Lessons if provided
        sections: sections?.length
          ? {
              create: sections.map((sec: any, sIdx: number) => ({
                title: sec.title || `Chương ${sIdx + 1}`,
                orderIndex: sIdx + 1,
                lessons: sec.lessons?.length
                  ? {
                      create: sec.lessons.map((les: any, lIdx: number) => ({
                        title: les.title || `Bài học ${lIdx + 1}`,
                        slug: slugify(les.title || `bai-${lIdx + 1}`) + "-" + Math.floor(100 + Math.random() * 900),
                        contentType: les.contentType || "VIDEO_YOUTUBE",
                        videoUrl: les.videoUrl || null,
                        videoDuration: parseInt(les.videoDuration) || 600,
                        contentBody: les.contentBody || null,
                        isPreview: Boolean(les.isPreview),
                        orderIndex: lIdx + 1,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tạo khóa học thành công!",
      course,
    });
  } catch (error: any) {
    console.error("Create Course Error:", error);
    return NextResponse.json({ error: "Lỗi tạo khóa học" }, { status: 500 });
  }
}
