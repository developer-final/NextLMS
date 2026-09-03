import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromStorage } from "@/lib/s3";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const isStaff =
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      user.role === "INSTRUCTOR";

    if (!isStaff) {
      return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
    }

    const { id } = await params;
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        course: { select: { instructorId: true } },
        lesson: {
          include: {
            section: {
              include: {
                course: { select: { instructorId: true } },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Tài liệu đính kèm không tồn tại" },
        { status: 404 }
      );
    }

    // Instructor ownership check
    if (user.role === "INSTRUCTOR") {
      const courseOwnerId =
        attachment.course?.instructorId ||
        attachment.lesson?.section?.course?.instructorId;
      if (courseOwnerId && courseOwnerId !== user.id) {
        return NextResponse.json(
          { error: "Bạn chỉ có thể xóa tài liệu thuộc khóa học của mình" },
          { status: 403 }
        );
      }
    }

    // Delete file from S3 / R2 storage if fileKey exists
    if (attachment.fileKey) {
      await deleteFileFromStorage(attachment.fileKey);
    }

    // Delete record from database
    await prisma.attachment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa tài liệu đính kèm thành công!",
    });
  } catch (error: any) {
    console.error("Delete Attachment Error:", error);
    return NextResponse.json(
      { error: "Lỗi xóa tài liệu đính kèm" },
      { status: 500 }
    );
  }
}
