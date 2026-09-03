import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { validateCourseInput } from "@/lib/validation";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: { select: { id: true, name: true, email: true } },
        attachments: true,
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              include: {
                attachments: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course does not exist" }, { status: 404 });
    }

    if (user.role === "INSTRUCTOR" && course.instructorId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to access this course" }, { status: 403 });
    }

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error("Course GET by ID Error:", error);
    return NextResponse.json({ error: "Error loading course details" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      title,
      slug: customSlug,
      categoryId,
      shortDescription,
      description,
      thumbnailUrl,
      introVideoUrl,
      price,
      salePrice,
      level,
      status,
      isFree,
      isFeatured,
      certificateEnabled,
      attachments,
      sections,
    } = body;

    const validation = validateCourseInput(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        sections: {
          include: { lessons: true },
        },
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course does not exist" }, { status: 404 });
    }

    if (user.role === "INSTRUCTOR" && existingCourse.instructorId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own courses" },
        { status: 403 }
      );
    }

    // Slug generation or validation
    let finalSlug = existingCourse.slug;
    if (customSlug && customSlug.trim() !== existingCourse.slug) {
      const formattedSlug = slugify(customSlug);
      const duplicate = await prisma.course.findFirst({
        where: { slug: formattedSlug, NOT: { id } },
      });
      finalSlug = duplicate ? `${formattedSlug}-${Date.now().toString().slice(-4)}` : formattedSlug;
    }

    const isFreeBool = Boolean(isFree);

    // Perform database operations in transaction
    const updatedCourse = await prisma.$transaction(async (tx) => {
      // 1. Update basic course metadata
      const course = await tx.course.update({
        where: { id },
        data: {
          title: title.trim(),
          slug: finalSlug,
          categoryId: categoryId || null,
          shortDescription: shortDescription || null,
          description: description || null,
          thumbnailUrl: thumbnailUrl || null,
          introVideoUrl: introVideoUrl || null,
          price: isFreeBool ? 0 : parseFloat(price) || 0,
          salePrice: isFreeBool ? 0 : salePrice ? parseFloat(salePrice) : null,
          level: level || "ALL_LEVELS",
          status: status || existingCourse.status,
          isFree: isFreeBool,
          isFeatured: Boolean(isFeatured),
          certificateEnabled: certificateEnabled !== undefined ? Boolean(certificateEnabled) : true,
        },
      });

      // 2. Sync sections and lessons if sections are provided
      if (Array.isArray(sections)) {
        const payloadSectionIds = sections.map((s: any) => s.id).filter(Boolean);
        const payloadLessonIds: string[] = [];

        sections.forEach((sec: any) => {
          if (Array.isArray(sec.lessons)) {
            sec.lessons.forEach((l: any) => {
              if (l.id) payloadLessonIds.push(l.id);
            });
          }
        });

        // Delete sections that are no longer in payload
        await tx.section.deleteMany({
          where: {
            courseId: id,
            id: { notIn: payloadSectionIds },
          },
        });

        // Loop through sections in payload
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const sec = sections[sIdx];
          let sectionRecord;

          if (sec.id && existingCourse.sections.some((s) => s.id === sec.id)) {
            // Update existing section
            sectionRecord = await tx.section.update({
              where: { id: sec.id },
              data: {
                title: sec.title || `Chương ${sIdx + 1}`,
                description: sec.description || null,
                orderIndex: sIdx + 1,
              },
            });
          } else {
            // Create new section
            sectionRecord = await tx.section.create({
              data: {
                courseId: id,
                title: sec.title || `Chương ${sIdx + 1}`,
                description: sec.description || null,
                orderIndex: sIdx + 1,
              },
            });
          }

          // Delete lessons in this section that were removed
          await tx.lesson.deleteMany({
            where: {
              sectionId: sectionRecord.id,
              id: { notIn: payloadLessonIds },
            },
          });

          // Sync lessons inside this section
          if (Array.isArray(sec.lessons)) {
            for (let lIdx = 0; lIdx < sec.lessons.length; lIdx++) {
              const les = sec.lessons[lIdx];
              const lessonSlug = slugify(les.title || `lesson-${lIdx + 1}`) + "-" + (lIdx + 1);

              let targetLessonId = les.id;

              if (les.id) {
                // Update lesson
                await tx.lesson.update({
                  where: { id: les.id },
                  data: {
                    sectionId: sectionRecord.id,
                    title: les.title || `Bài ${lIdx + 1}`,
                    contentType: les.contentType || "VIDEO_YOUTUBE",
                    videoUrl: les.videoUrl || null,
                    videoDuration: parseInt(les.videoDuration, 10) || 600,
                    contentBody: les.contentBody || null,
                    isPreview: Boolean(les.isPreview),
                    orderIndex: lIdx + 1,
                  },
                });
              } else {
                // Create lesson
                const newLes = await tx.lesson.create({
                  data: {
                    sectionId: sectionRecord.id,
                    title: les.title || `Bài ${lIdx + 1}`,
                    slug: lessonSlug,
                    contentType: les.contentType || "VIDEO_YOUTUBE",
                    videoUrl: les.videoUrl || null,
                    videoDuration: parseInt(les.videoDuration, 10) || 600,
                    contentBody: les.contentBody || null,
                    isPreview: Boolean(les.isPreview),
                    orderIndex: lIdx + 1,
                  },
                });
                targetLessonId = newLes.id;
              }

              // Sync attachments for this lesson if provided
              if (targetLessonId && Array.isArray(les.attachments)) {
                const payloadLesAttIds = les.attachments.map((a: any) => a.id).filter(Boolean);
                await tx.attachment.deleteMany({
                  where: {
                    lessonId: targetLessonId,
                    id: { notIn: payloadLesAttIds },
                  },
                });

                const newLesAtts = les.attachments.filter((a: any) => !a.id);
                if (newLesAtts.length > 0) {
                  await tx.attachment.createMany({
                    data: newLesAtts.map((a: any) => ({
                      lessonId: targetLessonId,
                      fileName: a.fileName,
                      fileUrl: a.fileUrl,
                      fileKey: a.fileKey || null,
                      fileSize: a.fileSize || null,
                      fileType: a.fileType || null,
                    })),
                  });
                }
              }
            }
          }
        }
      }

      // 3. Sync course-level attachments if provided
      if (Array.isArray(attachments)) {
        const payloadAttachmentIds = attachments.map((a: any) => a.id).filter(Boolean);
        await tx.attachment.deleteMany({
          where: {
            courseId: id,
            id: { notIn: payloadAttachmentIds },
          },
        });

        const newCourseAtts = attachments.filter((a: any) => !a.id);
        if (newCourseAtts.length > 0) {
          await tx.attachment.createMany({
            data: newCourseAtts.map((a: any) => ({
              courseId: id,
              fileName: a.fileName,
              fileUrl: a.fileUrl,
              fileKey: a.fileKey || null,
              fileSize: a.fileSize || null,
              fileType: a.fileType || null,
            })),
          });
        }
      }

      return course;
    });


    return NextResponse.json({
      success: true,
      message: "Course updated successfully!",
      course: updatedCourse,
    });
  } catch (error: any) {
    console.error("Course PUT Error:", error);
    return NextResponse.json({ error: "Error updating course" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json({ error: "Course does not exist" }, { status: 404 });
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully!",
    });
  } catch (error: any) {
    console.error("Course DELETE Error:", error);
    return NextResponse.json({ error: "Error deleting course" }, { status: 500 });
  }
}
