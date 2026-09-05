import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { indexDocumentText } from "@/lib/ai/rag/vector-store";

/**
 * GET: List knowledge documents
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "SUPER_ADMIN" &&
        user.role !== "INSTRUCTOR")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const whereCondition: any = {};
    if (courseId) {
      whereCondition.courseId = courseId;
    }

    const docs = await prisma.knowledgeDocument.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        chunkCount: true,
        courseId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, documents: docs });
  } catch (error: any) {
    console.error("List knowledge documents error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list documents" },
      { status: 500 }
    );
  }
}

/**
 * POST: Upload & Index Knowledge Document
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "SUPER_ADMIN" &&
        user.role !== "INSTRUCTOR")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    let title = "";
    let fileName = "";
    let fileType = "text/plain";
    let fileSize = 0;
    let textContent = "";
    let courseId: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      courseId = (formData.get("courseId") as string) || undefined;
      title = (formData.get("title") as string) || "";

      if (!file) {
        return NextResponse.json(
          { error: "File is required" },
          { status: 400 }
        );
      }

      fileName = file.name;
      fileType = file.type || "text/plain";
      fileSize = file.size;
      title = title || file.name.replace(/\.[^/.]+$/, "");

      // Read text content based on file type
      if (
        fileName.toLowerCase().endsWith(".pdf") ||
        fileType === "application/pdf"
      ) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const pdfParseModule = await import("pdf-parse");
          const pdfParse = (pdfParseModule as any).default || pdfParseModule;
          const pdfData = await pdfParse(buffer);
          textContent = pdfData.text || "";
        } catch (pdfErr: any) {
          console.error("PDF parse error, fallback to text:", pdfErr);
          textContent = await file.text();
        }
      } else {
        textContent = await file.text();
      }
    } else {
      const body = await req.json();
      title = body.title || "Untitled Document";
      fileName = body.fileName || `${title}.txt`;
      fileType = body.fileType || "text/plain";
      fileSize = (body.content || "").length;
      textContent = body.content || "";
      courseId = body.courseId;
    }

    if (!textContent.trim()) {
      return NextResponse.json(
        { error: "Document content cannot be empty" },
        { status: 400 }
      );
    }

    // 1. Create document record in database
    const doc = await prisma.knowledgeDocument.create({
      data: {
        title,
        fileName,
        fileType,
        fileSize,
        content: textContent.slice(0, 50000), // preserve preview text
        status: "PROCESSING",
        courseId,
        authorId: user.id,
      },
    });

    // 2. Run chunking & vector indexing
    const { chunkCount } = await indexDocumentText(doc.id, textContent);

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        chunkCount,
        status: "READY",
      },
    });
  } catch (error: any) {
    console.error("Upload knowledge document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove knowledge document
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "SUPER_ADMIN" &&
        user.role !== "INSTRUCTOR")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    await prisma.knowledgeDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete knowledge document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
