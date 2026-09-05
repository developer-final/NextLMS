import { prisma } from "@/lib/prisma";
import { CourseOutline, CourseOutlineSection } from "../types";
import {
  generateCourseOutline,
  generateLessonArticle,
  generateQuizFromContent,
} from "../service";
import { searchSimilarChunks } from "../rag/vector-store";
import { slugify } from "@/lib/utils";

export interface CoursePlanInput {
  topic: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  targetAudience: string;
  knowledgeDocIds?: string[];
}

export interface CourseExecuteInput {
  courseId: string;
  outline: CourseOutline;
  knowledgeDocIds?: string[];
  generateQuizForEachLesson?: boolean;
}

/**
 * 1. Planner Agent: Drafts comprehensive course outline
 */
export async function runCoursePlannerAgent(
  input: CoursePlanInput
): Promise<CourseOutline> {
  let contextDocs: string[] = [];

  if (input.knowledgeDocIds && input.knowledgeDocIds.length > 0) {
    const chunks = await searchSimilarChunks(input.topic, {
      documentIds: input.knowledgeDocIds,
      limit: 6,
    });
    contextDocs = chunks.map((c) => c.content);
  }

  return generateCourseOutline(
    input.topic,
    input.level,
    input.targetAudience,
    contextDocs
  );
}

export interface InitCourseStructureResult {
  courseId: string;
  courseTitle: string;
  sectionsCreated: number;
  totalLessons: number;
  lessons: {
    lessonId: string;
    sectionId: string;
    sectionTitle: string;
    lessonTitle: string;
    contentType: "ARTICLE" | "VIDEO_YOUTUBE" | "QUIZ";
    orderIndex: number;
  }[];
}

/**
 * 2. Structure Initializer: Fast database setup for sections and lessons shell
 * Executes in ~100ms, completely immune to gateway timeouts
 */
export async function initCourseStructure(
  courseId: string,
  outline: CourseOutline
): Promise<InitCourseStructureResult> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { sections: true },
  });

  if (!course) {
    throw new Error(`Course with ID ${courseId} not found`);
  }

  let sectionIndex = course.sections.length;
  const createdLessons: InitCourseStructureResult["lessons"] = [];

  for (const secData of outline.sections) {
    sectionIndex++;

    const section = await prisma.section.create({
      data: {
        courseId,
        title: secData.title,
        description: secData.description || null,
        orderIndex: sectionIndex,
      },
    });

    let lessonIndex = 0;
    for (const lesData of secData.lessons) {
      lessonIndex++;
      const baseSlug = slugify(lesData.title);
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}${lessonIndex}`;

      const lesson = await prisma.lesson.create({
        data: {
          sectionId: section.id,
          title: lesData.title,
          slug: uniqueSlug,
          contentType: lesData.contentType,
          contentBody: "",
          orderIndex: lessonIndex,
          isPreview: lessonIndex === 1 && sectionIndex === 1,
        },
      });

      createdLessons.push({
        lessonId: lesson.id,
        sectionId: section.id,
        sectionTitle: secData.title,
        lessonTitle: lesData.title,
        contentType: lesData.contentType,
        orderIndex: lessonIndex,
      });
    }
  }

  return {
    courseId,
    courseTitle: course.title,
    sectionsCreated: outline.sections.length,
    totalLessons: createdLessons.length,
    lessons: createdLessons,
  };
}

/**
 * 3. Single Lesson Content Generator
 * Generates rich markdown content or interactive quiz for an individual lesson
 */
export async function generateSingleLesson(
  lessonId: string,
  courseTitle: string,
  sectionTitle: string,
  lessonTitle: string,
  contentType: "ARTICLE" | "VIDEO_YOUTUBE" | "QUIZ",
  knowledgeDocIds?: string[]
): Promise<{ lessonId: string; success: boolean }> {
  let lessonContext: string[] = [];
  if (knowledgeDocIds && knowledgeDocIds.length > 0) {
    const chunks = await searchSimilarChunks(`${sectionTitle} ${lessonTitle}`, {
      documentIds: knowledgeDocIds,
      limit: 4,
    });
    lessonContext = chunks.map((c) => c.content);
  }

  let contentBody = "";
  if (contentType === "ARTICLE") {
    contentBody = await generateLessonArticle(
      courseTitle,
      sectionTitle,
      lessonTitle,
      lessonContext
    );
  } else if (contentType === "QUIZ") {
    const quizContext =
      lessonContext.length > 0
        ? lessonContext.join("\n\n")
        : `${sectionTitle} ${lessonTitle}`;
    const quizList = await generateQuizFromContent(quizContext, 5);
    contentBody =
      `# ${lessonTitle}\n\n` +
      quizList
        .map(
          (q, qIdx) =>
            `### Câu ${qIdx + 1}: ${q.question}\n` +
            q.options
              .map(
                (opt, optIdx) =>
                  `- [${optIdx === q.correctAnswerIndex ? "x" : " "}] ${opt}`
              )
              .join("\n") +
            `\n\n> **Giải thích**: ${q.explanation}\n`
        )
        .join("\n\n---\n\n");
  } else {
    contentBody =
      `# Bài giảng Video: ${lessonTitle}\n\n` +
      `**Chương**: ${sectionTitle}\n\n` +
      `### Dàn ý Kịch bản Video\n` +
      `- **Mở đầu (0:00 - 1:30)**: Giới thiệu mục tiêu và vấn đề then chốt.\n` +
      `- **Nội dung trọng tâm (1:30 - 8:00)**: Phân tích nguyên lý và hướng dẫn thực hành từng bước.\n` +
      `- **Tổng kết & Bài tập (8:00 - 10:00)**: Tóm tắt điểm cốt lõi và hành động cần làm.`;
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { contentBody },
  });

  return { lessonId, success: true };
}

/**
 * 4. All-in-one Executor Agent (with backward compatibility)
 */
export async function runCourseExecutorAgent(
  input: CourseExecuteInput,
  onProgress?: (step: string, current: number, total: number) => void
): Promise<{ sectionsCreated: number; lessonsCreated: number }> {
  const { courseId, outline, knowledgeDocIds } = input;

  const initResult = await initCourseStructure(courseId, outline);

  let current = 0;
  for (const les of initResult.lessons) {
    current++;
    if (onProgress) {
      onProgress(
        `Generating content for "${les.lessonTitle}"...`,
        current,
        initResult.totalLessons
      );
    }

    await generateSingleLesson(
      les.lessonId,
      initResult.courseTitle,
      les.sectionTitle,
      les.lessonTitle,
      les.contentType,
      knowledgeDocIds
    );
  }

  return {
    sectionsCreated: initResult.sectionsCreated,
    lessonsCreated: initResult.totalLessons,
  };
}
