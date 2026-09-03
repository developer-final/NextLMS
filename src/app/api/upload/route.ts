import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFileToStorage } from "@/lib/s3";
import {
  validateFileUpload,
  UploadTargetType,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to upload files" },
        { status: 401 }
      );
    }

    const user = session.user;
    const isStaff =
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      user.role === "INSTRUCTOR";

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = ((formData.get("type") as string) || "attachment") as UploadTargetType;
    const courseId = (formData.get("courseId") as string) || undefined;
    const lessonId = (formData.get("lessonId") as string) || undefined;
    const postId = (formData.get("postId") as string) || undefined;

    // Permissions: 'avatar' and 'receipt' can be uploaded by any authenticated user.
    // Course and blog assets ('thumbnail', 'video', 'attachment') require staff privileges.
    if (type !== "avatar" && type !== "receipt" && !isStaff) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to upload files" },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Bad Request: No file provided for upload" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Custom max size from environment
    const maxVideoSize = process.env.MAX_VIDEO_SIZE_MB
      ? parseInt(process.env.MAX_VIDEO_SIZE_MB, 10)
      : 1024;
    const maxAttachmentSize = process.env.MAX_ATTACHMENT_SIZE_MB
      ? parseInt(process.env.MAX_ATTACHMENT_SIZE_MB, 10)
      : 50;
    const maxAvatarSize = process.env.MAX_AVATAR_SIZE_MB
      ? parseInt(process.env.MAX_AVATAR_SIZE_MB, 10)
      : 5;

    // Validate size, extension, MIME, blacklist and magic bytes
    const validation = validateFileUpload({
      buffer,
      fileName: file.name,
      mimeType: file.type,
      type,
      maxSizeMb:
        type === "video"
          ? maxVideoSize
          : type === "avatar"
          ? maxAvatarSize
          : type === "attachment"
          ? maxAttachmentSize
          : 5,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid file payload" },
        { status: 400 }
      );
    }

    // If INSTRUCTOR, ensure they own the course, lesson, or post if IDs provided
    if (user.role === "INSTRUCTOR") {
      if (courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { instructorId: true },
        });
        if (course && course.instructorId !== user.id) {
          return NextResponse.json(
            { error: "Forbidden: You do not have permission to add resources to this course" },
            { status: 403 }
          );
        }
      }
      if (lessonId) {
        const lesson = await prisma.lesson.findUnique({
          where: { id: lessonId },
          include: { section: { include: { course: true } } },
        });
        if (lesson && lesson.section.course.instructorId !== user.id) {
          return NextResponse.json(
            { error: "Forbidden: You do not have permission to add resources to this lesson" },
            { status: 403 }
          );
        }
      }
      if (postId) {
        const post = await prisma.blogPost.findUnique({
          where: { id: postId },
          select: { authorId: true },
        });
        if (post && post.authorId !== user.id) {
          return NextResponse.json(
            { error: "Forbidden: You do not have permission to add resources to this article" },
            { status: 403 }
          );
        }
      }
    }

    // Generate safe storage key
    let storageKey = "";
    if (type === "avatar") {
      const randSuffix = Math.random().toString(36).substring(2, 8);
      storageKey = `avatars/${user.id}/${Date.now()}-${randSuffix}.${validation.fileExt}`;
    } else if (type === "receipt") {
      const randSuffix = Math.random().toString(36).substring(2, 8);
      storageKey = `receipts/${user.id}/${Date.now()}-${randSuffix}.${validation.fileExt}`;
    } else if (type === "thumbnail") {
      const randSuffix = Math.random().toString(36).substring(2, 8);
      storageKey = `thumbnails/${Date.now()}-${randSuffix}.${validation.fileExt}`;
    } else if (type === "video") {
      const folder = lessonId
        ? `lessons/${lessonId}`
        : courseId
        ? `courses/${courseId}`
        : "general";
      storageKey = `courses/videos/${folder}/${Date.now()}-${validation.sanitizedName}`;
    } else {
      const folder = postId
        ? `posts/${postId}`
        : lessonId
        ? `lessons/${lessonId}`
        : courseId
        ? `courses/${courseId}`
        : "general";
      storageKey = `attachments/${folder}/${Date.now()}-${validation.sanitizedName}`;
    }

    // Upload to S3 / Cloudflare R2 (or local dev storage fallback)
    const uploadResult = await uploadFileToStorage({
      buffer,
      key: storageKey,
      contentType: file.type || (type === "video" ? "video/mp4" : "application/octet-stream"),
      isPublic: type === "thumbnail" || type === "avatar" || type === "receipt",
    });

    // If avatar upload, automatically persist avatarUrl to User record
    if (type === "avatar") {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: uploadResult.url },
      });
    }

    // If attachment and associated with a persisted course, lesson, or post, save to database
    let createdAttachment = null;
    if (type === "attachment" && (courseId || lessonId || postId)) {
      createdAttachment = await prisma.attachment.create({
        data: {
          courseId: courseId || undefined,
          lessonId: lessonId || undefined,
          postId: postId || undefined,
          fileName: validation.sanitizedName || file.name,
          fileUrl: uploadResult.url,
          fileKey: uploadResult.key,
          fileSize: buffer.length,
          fileType: file.type || validation.fileExt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully!",
      url: uploadResult.url,
      key: uploadResult.key,
      fileName: validation.sanitizedName || file.name,
      fileSize: buffer.length,
      fileType: file.type || validation.fileExt,
      attachment: createdAttachment,
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: "Error occurred while uploading file to server" },
      { status: 500 }
    );
  }
}
