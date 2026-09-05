import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  runCoursePlannerAgent,
  runCourseExecutorAgent,
} from "@/lib/ai/agent/course-workflow";

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
    const { action } = body;

    // Action 1: Plan course syllabus
    if (action === "plan") {
      const { topic, level, targetAudience, knowledgeDocIds } = body;

      if (!topic) {
        return NextResponse.json(
          { error: "Course topic is required" },
          { status: 400 }
        );
      }

      const outline = await runCoursePlannerAgent({
        topic,
        level: level || "ALL_LEVELS",
        targetAudience: targetAudience || "All students",
        knowledgeDocIds,
      });

      return NextResponse.json({ success: true, outline });
    }

    // Action 2: Execute approved syllabus into course
    if (action === "execute") {
      const { courseId, outline, knowledgeDocIds } = body;

      if (!courseId || !outline) {
        return NextResponse.json(
          { error: "courseId and outline are required" },
          { status: 400 }
        );
      }

      const result = await runCourseExecutorAgent({
        courseId,
        outline,
        knowledgeDocIds,
      });

      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'plan' or 'execute'." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Course generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate course" },
      { status: 500 }
    );
  }
}
