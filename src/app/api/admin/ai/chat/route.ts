import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { streamCopilotChat } from "@/lib/ai/service";
import { ChatMessage } from "@/lib/ai/types";
import { searchSimilarChunks } from "@/lib/ai/rag/vector-store";
import { getClientIp, aiRateLimiter } from "@/lib/rate-limit";

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

    const clientIp = getClientIp(req);
    const rateCheck = aiRateLimiter.check(`${clientIp}_${user.id}`);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: `AI rate limit exceeded. Please wait ${waitSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messages, documentIds, courseId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Tenant Isolation Check for INSTRUCTOR
    if (user.role === "INSTRUCTOR") {
      if (courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { instructorId: true },
        });
        if (!course || course.instructorId !== user.id) {
          return NextResponse.json(
            { error: "Forbidden: You do not have permission to access this course" },
            { status: 403 }
          );
        }
      }

      if (Array.isArray(documentIds) && documentIds.length > 0) {
        const docs = await prisma.knowledgeDocument.findMany({
          where: { id: { in: documentIds } },
          select: { id: true, authorId: true, course: { select: { instructorId: true } } },
        });
        const hasUnauthorizedDoc = docs.some(
          (d) => d.authorId !== user.id && d.course?.instructorId !== user.id
        );
        if (hasUnauthorizedDoc || docs.length !== documentIds.length) {
          return NextResponse.json(
            { error: "Forbidden: You do not have permission to access one or more requested knowledge documents" },
            { status: 403 }
          );
        }
      }
    }

    // Retrieve RAG context if documentIds or courseId provided
    let contextDocs: string[] = [];
    const lastUserQuery =
      messages[messages.length - 1]?.content || "general assistance";

    if ((documentIds && documentIds.length > 0) || courseId) {
      const chunks = await searchSimilarChunks(lastUserQuery, {
        documentIds,
        courseId,
        limit: 4,
      });
      contextDocs = chunks.map((c) => c.content);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamCopilotChat(
            messages as ChatMessage[],
            contextDocs
          )) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error: any) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: error.message || "Streaming failed",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
