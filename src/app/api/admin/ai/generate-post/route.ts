import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runBlogPostAgent } from "@/lib/ai/agent/post-workflow";

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

    const body = await req.json();
    const { topic, tone, keywords, knowledgeDocIds } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Article topic is required" },
        { status: 400 }
      );
    }

    const result = await runBlogPostAgent({
      topic,
      tone,
      keywords,
      knowledgeDocIds,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Blog post generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate blog post" },
      { status: 500 }
    );
  }
}
