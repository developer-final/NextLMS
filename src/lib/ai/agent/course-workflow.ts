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

/**
 * 2. Executor Agent: Creates sections, lessons, and content in database
 */
export async function runCourseExecutorAgent(
  input: CourseExecuteInput,
  onProgress?: (step: string, current: number, total: number) => void
): Promise<{ sectionsCreated: number; lessonsCreated: number }> {
  const { courseId, outline } = input;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { sections: true },
  });

  if (!course) {
    throw new Error(`Course with ID ${courseId} not found`);
  }

  // Count total lessons
  const totalLessons = outline.sections.reduce(
    (acc, sec) => acc + sec.lessons.length,
    0
  );

  let currentLessonCount = 0;
  let sectionsCreated = 0;
  let lessonsCreated = 0;

  // Determine starting order index
  let sectionIndex = course.sections.length;

  for (const secData of outline.sections) {
    sectionIndex++;
    sectionsCreated++;

    // Create Section in database
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
      currentLessonCount++;
      lessonsCreated++;

      if (onProgress) {
        onProgress(
          `Generating content for "${lesData.title}"...`,
          currentLessonCount,
          totalLessons
        );
      }

      // Retrieve contextual knowledge for this specific lesson
      let lessonContext: string[] = [];
      if (input.knowledgeDocIds && input.knowledgeDocIds.length > 0) {
        const chunks = await searchSimilarChunks(
          `${secData.title} ${lesData.title}`,
          {
            documentIds: input.knowledgeDocIds,
            limit: 4,
          }
        );
        lessonContext = chunks.map((c) => c.content);
      }

      // Generate lesson body
      let contentBody = "";
      if (lesData.contentType === "ARTICLE") {
        contentBody = await generateLessonArticle(
          course.title,
          secData.title,
          lesData.title,
          lessonContext
        );
      } else if (lesData.contentType === "QUIZ") {
        const quizList = await generateQuizFromContent(
          `${secData.title} ${lesData.title}`,
          5
        );
        contentBody = `# ${lesData.title}\n\n` +
          quizList
            .map(
              (q, qIdx) =>
                `### Question ${qIdx + 1}: ${q.question}\n` +
                q.options
                  .map((opt, optIdx) => `- [${optIdx === q.correctAnswerIndex ? "x" : " "}] ${opt}`)
                  .join("\n") +
                `\n\n> **Explanation**: ${q.explanation}\n`
            )
            .join("\n\n---\n\n");
      } else {
        contentBody = `# Video Lecture: ${lesData.title}\n\n` +
          `**Module**: ${secData.title}\n\n` +
          `### Video Script Outline\n` +
          `- **Intro (0:00 - 1:30)**: Introduction to key objectives.\n` +
          `- **Main Teaching (1:30 - 8:00)**: Step-by-step demonstration.\n` +
          `- **Wrap Up (8:00 - 10:00)**: Summary and action items.`;
      }

      const baseSlug = slugify(lesData.title);
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      // Create Lesson in database
      await prisma.lesson.create({
        data: {
          sectionId: section.id,
          title: lesData.title,
          slug: uniqueSlug,
          contentType: lesData.contentType,
          contentBody,
          orderIndex: lessonIndex,
          isPreview: lessonIndex === 1 && sectionIndex === 1,
        },
      });
    }
  }

  return { sectionsCreated, lessonsCreated };
}
