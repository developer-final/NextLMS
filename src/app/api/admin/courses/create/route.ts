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
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Unauthorized: Staff privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const validation = validateCourseInput(body);
    if (!validation.isValid || !validation.sanitized) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      categoryId,
      thumbnailUrl,
      introVideoUrl,
      price,
      salePrice,
      level,
      isFree,
      isFeatured,
      attachments,
    } = body;

    const {
      title: cleanTitle,
      shortDescription: cleanShortDesc,
      description: cleanDesc,
      sections: cleanSections,
      tagNames: cleanTags = [],
    } = validation.sanitized;

    const slug = slugify(cleanTitle) + "-" + Date.now().toString().slice(-4);

    // Upsert tags and prepare connect relation
    const tagConnectOps: { id: string }[] = [];
    if (cleanTags.length > 0) {
      for (const name of cleanTags) {
        const tagSlug = slugify(name);
        const tag = await prisma.tag.upsert({
          where: { name },
          update: {},
          create: {
            name,
            slug: tagSlug || `tag-${Date.now()}`,
          },
        });
        tagConnectOps.push({ id: tag.id });
      }
    }

    const course = await prisma.course.create({
      data: {
        instructorId: user.id,
        categoryId: categoryId || null,
        title: cleanTitle,
        slug,
        shortDescription: cleanShortDesc,
        description: cleanDesc,
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
        tags: tagConnectOps.length > 0 ? { connect: tagConnectOps } : undefined,
        // Create Course-level Attachments if provided
        attachments: attachments?.length
          ? {
              create: attachments.map((att: any) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileKey: att.fileKey || null,
                fileSize: att.fileSize || null,
                fileType: att.fileType || null,
              })),
            }
          : undefined,
        // Create Sections & Lessons if provided
        sections: cleanSections?.length
          ? {
              create: cleanSections.map((sec, sIdx) => {
                const rawSec = Array.isArray(body.sections) ? body.sections[sIdx] : undefined;
                return {
                  title: sec.title || `Chương ${sIdx + 1}`,
                  description: sec.description || null,
                  orderIndex: sIdx + 1,
                  lessons: sec.lessons?.length
                    ? {
                        create: sec.lessons.map((les, lIdx) => {
                          const rawLes = rawSec?.lessons?.[lIdx];
                          return {
                            title: les.title || `Bài học ${lIdx + 1}`,
                            slug: slugify(les.title || `bai-${lIdx + 1}`) + "-" + Math.floor(100 + Math.random() * 900),
                            contentType: rawLes?.contentType || "VIDEO_YOUTUBE",
                            videoUrl: rawLes?.videoUrl || null,
                            videoDuration: parseInt(rawLes?.videoDuration) || 600,
                            contentBody: les.contentBody || null,
                            isPreview: Boolean(rawLes?.isPreview),
                            orderIndex: lIdx + 1,
                            attachments: rawLes?.attachments?.length
                              ? {
                                  create: rawLes.attachments.map((att: any) => ({
                                    fileName: att.fileName,
                                    fileUrl: att.fileUrl,
                                    fileKey: att.fileKey || null,
                                    fileSize: att.fileSize || null,
                                    fileType: att.fileType || null,
                                  })),
                                }
                              : undefined,
                          };
                        }),
                      }
                    : undefined,
                };
              }),
            }
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Course created successfully!",
      course,
    });
  } catch (error: any) {
    console.error("Create Course Error:", error);
    return NextResponse.json({ error: "Error creating course" }, { status: 500 });
  }
}
