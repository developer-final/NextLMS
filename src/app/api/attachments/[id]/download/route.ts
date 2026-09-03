import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSecureDownloadUrl } from "@/lib/s3";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    const { id } = await params;
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        course: true,
        lesson: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment does not exist or has been removed" },
        { status: 404 }
      );
    }

    const targetCourseId =
      attachment.courseId || attachment.lesson?.section?.courseId;
    const courseInstructorId =
      attachment.course?.instructorId ||
      attachment.lesson?.section?.course?.instructorId;

    // Check staff access
    const isStaff =
      userRole === "ADMIN" ||
      userRole === "SUPER_ADMIN" ||
      (userRole === "INSTRUCTOR" && courseInstructorId === userId);

    let isAuthorized = isStaff;

    // If attached to a free preview lesson
    if (!isAuthorized && attachment.lesson?.isPreview) {
      isAuthorized = true;
    }

    // Check active enrollment
    if (!isAuthorized && userId && targetCourseId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: targetCourseId,
          },
        },
      });

      if (enrollment && enrollment.status === "ACTIVE") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            "You need to be enrolled in this course to download attachments",
        },
        { status: 403 }
      );
    }

    // If attachment has S3 fileKey, generate secure signed URL
    if (attachment.fileKey) {
      const secureUrl = await getSecureDownloadUrl({
        key: attachment.fileKey,
        fileName: attachment.fileName,
        expiresInSeconds: 3600, // Valid for 1 hour
      });
      return NextResponse.redirect(secureUrl);
    }

    // Direct redirection to public/local URL
    if (attachment.fileUrl) {
      if (attachment.fileUrl.startsWith("http")) {
        return NextResponse.redirect(attachment.fileUrl);
      }
      return NextResponse.redirect(new URL(attachment.fileUrl, req.url));
    }

    return NextResponse.json(
      { error: "File URL not found" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Download Attachment Error:", error);
    return NextResponse.json(
      { error: "Error generating attachment download link" },
      { status: 500 }
    );
  }
}
