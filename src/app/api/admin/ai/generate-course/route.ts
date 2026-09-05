import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  runCoursePlannerAgent,
  runCourseExecutorAgent,
  initCourseStructure,
  generateSingleLesson,
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

    // Action 2: Fast Structure Initialization (Zero timeout risk, ~100ms)
    if (action === "init-structure") {
      const { courseId, outline } = body;

      if (!courseId || !outline) {
        return NextResponse.json(
          { error: "courseId and outline are required" },
          { status: 400 }
        );
      }

      const initResult = await initCourseStructure(courseId, outline);
      return NextResponse.json({ success: true, ...initResult });
    }

    // Action 3: Generate Individual Lesson Content
    if (action === "generate-lesson") {
      const {
        lessonId,
        courseTitle,
        sectionTitle,
        lessonTitle,
        contentType,
        knowledgeDocIds,
      } = body;

      if (!lessonId || !lessonTitle) {
        return NextResponse.json(
          { error: "lessonId and lessonTitle are required" },
          { status: 400 }
        );
      }

      const result = await generateSingleLesson(
        lessonId,
        courseTitle || "Khóa học",
        sectionTitle || "Chương học",
        lessonTitle,
        contentType || "ARTICLE",
        knowledgeDocIds
      );

      return NextResponse.json(result);
    }

    // Action 4: Execute approved syllabus all-in-one (legacy/backward compatibility)
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
      { error: "Invalid action. Use 'plan', 'init-structure', 'generate-lesson', or 'execute'." },
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
