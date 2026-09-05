import {
  ChatMessage,
  CourseOutline,
  GenerateOptions,
  QuizQuestion,
  SEOMetadata,
} from "./types";
import { streamChat, generateText } from "./providers";
import {
  simulateCourseOutline,
  simulateLessonContent,
  simulateBlogPost,
  simulateSEOMetadata,
  simulateQuiz,
} from "./mock-proxy";
import { getSystemSettings } from "@/lib/config";
import {
  isDevEnvironment,
  isDevBridgeRunning,
  enqueueDevTask,
  waitForDevTask,
} from "./dev-bridge";

/**
 * Higher-Level AI Service Layer
 */

/**
 * 1. Stream Copilot Chat with Context Documents
 */
export async function* streamCopilotChat(
  messages: ChatMessage[],
  contextDocs?: string[],
  options?: GenerateOptions
): AsyncGenerator<string, void, unknown> {
  const enrichedMessages = [...messages];

  // If context docs provided, inject into system message
  if (contextDocs && contextDocs.length > 0) {
    const docContextBlock = `\n\n[REFERENCE KNOWLEDGE DOCUMENTS (RAG)]:\n${contextDocs
      .map((doc, idx) => `--- Document ${idx + 1} ---\n${doc}`)
      .join("\n\n")}\n[END REFERENCE]`;

    const existingSysIdx = enrichedMessages.findIndex((m) => m.role === "system");
    if (existingSysIdx >= 0) {
      enrichedMessages[existingSysIdx].content += docContextBlock;
    } else {
      enrichedMessages.unshift({
        role: "system",
        content: `You are NextLMS AI Assistant. Ground your knowledge in the following materials:${docContextBlock}`,
      });
    }
  }

  yield* streamChat(enrichedMessages, {
    ...options,
    contextDocs,
  });
}

/**
 * 2. Generate Course Outline (Syllabus)
 */
export async function generateCourseOutline(
  topic: string,
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" = "ALL_LEVELS",
  targetAudience: string = "All learners",
  contextDocs?: string[],
  options?: GenerateOptions
): Promise<CourseOutline> {
  const settings = await getSystemSettings();
  const isMock = options?.devMockEnabled ?? settings.aiDevMockEnabled;

  if (isMock) {
    if (isDevEnvironment() && isDevBridgeRunning()) {
      try {
        const taskId = enqueueDevTask("course_outline", {
          prompt: `Create course outline on "${topic}", level "${level}", target "${targetAudience}"`,
          contextDocs,
        });
        const result = await waitForDevTask(taskId);
        const parsed = JSON.parse(result);
        if (parsed.title && Array.isArray(parsed.sections)) {
          return parsed as CourseOutline;
        }
      } catch (err) {
        console.warn("Dev AI Bridge outline fallback to mock:", err);
      }
    }
    return simulateCourseOutline(topic, level, targetAudience);
  }

  const prompt = `You are a world-class curriculum designer for an online academy.
Create a structured course outline for:
Topic: "${topic}"
Level: "${level}"
Target Audience: "${targetAudience}"
${contextDocs && contextDocs.length > 0 ? `Reference Notes: ${contextDocs.join("\n")}` : ""}

Output STRICTLY valid JSON following this schema:
{
  "title": "Course Title",
  "description": "Course Overview Description",
  "targetAudience": "${targetAudience}",
  "level": "${level}",
  "sections": [
    {
      "title": "Module 1: Title",
      "description": "Module description",
      "lessons": [
        {
          "title": "1.1 Lesson Title",
          "description": "Short lesson objective",
          "contentType": "ARTICLE" // or "VIDEO_YOUTUBE" or "QUIZ"
        }
      ]
    }
  ]
}`;

  try {
    const raw = await generateText(
      [
        { role: "system", content: "You output JSON only without markdown code fences." },
        { role: "user", content: prompt },
      ],
      options
    );

    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(clean);
  } catch {
    // Fallback to simulation outline if parsing fails
    return simulateCourseOutline(topic, level, targetAudience);
  }
}

/**
 * 3. Generate Lesson Article in Markdown
 */
export async function generateLessonArticle(
  courseTitle: string,
  sectionTitle: string,
  lessonTitle: string,
  contextDocs?: string[],
  options?: GenerateOptions
): Promise<string> {
  const settings = await getSystemSettings();
  const isMock = options?.devMockEnabled ?? settings.aiDevMockEnabled;

  if (isMock) {
    if (isDevEnvironment() && isDevBridgeRunning()) {
      try {
        const taskId = enqueueDevTask("lesson_content", {
          prompt: `Write lesson content for "${lessonTitle}" in section "${sectionTitle}" of "${courseTitle}"`,
          contextDocs,
        });
        const result = await waitForDevTask(taskId);
        if (result && result.trim().length > 50) return result;
      } catch (err) {
        console.warn("Dev AI Bridge lesson fallback to mock:", err);
      }
    }
    return simulateLessonContent(courseTitle, sectionTitle, lessonTitle, contextDocs);
  }

  const prompt = `Write an in-depth, professional, engaging lesson in Markdown for:
Course: "${courseTitle}"
Module: "${sectionTitle}"
Lesson: "${lessonTitle}"
${contextDocs && contextDocs.length > 0 ? `Reference Curriculum:\n${contextDocs.join("\n\n")}` : ""}

Structure requirements:
1. Overview & Learning Objectives
2. Core Concepts with bullet points and practical tips
3. Step-by-Step Practical Application with code blocks or execution checklist
4. Key Takeaways Summary`;

  return generateText(
    [
      { role: "system", content: "You are an expert educator producing rich, structured Markdown lesson content." },
      { role: "user", content: prompt },
    ],
    options
  );
}

/**
 * 4. Generate Blog Post in Markdown
 */
export async function generateBlogPostContent(
  topic: string,
  tone: string = "Professional",
  keywords: string = "finance, trading, education",
  contextDocs?: string[],
  options?: GenerateOptions
): Promise<string> {
  const settings = await getSystemSettings();
  const isMock = options?.devMockEnabled ?? settings.aiDevMockEnabled;

  if (isMock) {
    if (isDevEnvironment() && isDevBridgeRunning()) {
      try {
        const taskId = enqueueDevTask("blog_post", {
          prompt: `Write blog post on "${topic}". Tone: "${tone}". Keywords: "${keywords}"`,
          contextDocs,
        });
        const result = await waitForDevTask(taskId);
        if (result && result.trim().length > 50) return result;
      } catch (err) {
        console.warn("Dev AI Bridge blog fallback to mock:", err);
      }
    }
    return simulateBlogPost(topic, tone, keywords, contextDocs);
  }

  const prompt = `Write a comprehensive, SEO-optimized blog article in Markdown on:
Topic: "${topic}"
Tone: "${tone}"
Keywords: "${keywords}"
${contextDocs && contextDocs.length > 0 ? `Reference Notes:\n${contextDocs.join("\n\n")}` : ""}

Include H1 title, subheadings (H2, H3), bullet points, actionable tips, callouts, and conclusion.`;

  return generateText(
    [
      { role: "system", content: "You are a senior financial and technical writer creating compelling blog articles." },
      { role: "user", content: prompt },
    ],
    options
  );
}

/**
 * 5. Generate Quiz from Content
 */
export async function generateQuizFromContent(
  content: string,
  count: number = 5,
  options?: GenerateOptions
): Promise<QuizQuestion[]> {
  const settings = await getSystemSettings();
  const isMock = options?.devMockEnabled ?? settings.aiDevMockEnabled;

  if (isMock) {
    if (isDevEnvironment() && isDevBridgeRunning()) {
      try {
        const taskId = enqueueDevTask("quiz", {
          prompt: `Generate ${count} quiz questions based on content: "${content.slice(0, 1000)}"`,
        });
        const result = await waitForDevTask(taskId);
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (err) {
        console.warn("Dev AI Bridge quiz fallback to mock:", err);
      }
    }
    return simulateQuiz(content, count);
  }

  const prompt = `Generate ${count} multiple choice assessment questions based on this lesson content:
"""
${content.slice(0, 3000)}
"""

Output STRICTLY valid JSON array:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Why Option A is correct"
  }
]`;

  try {
    const raw = await generateText(
      [
        { role: "system", content: "You output JSON only without markdown code fences." },
        { role: "user", content: prompt },
      ],
      options
    );

    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(clean);
  } catch {
    return simulateQuiz(content, count);
  }
}

/**
 * 6. Generate SEO Metadata
 */
export async function generateSEOFromContent(
  title: string,
  content: string,
  options?: GenerateOptions
): Promise<SEOMetadata> {
  const settings = await getSystemSettings();
  const isMock = options?.devMockEnabled ?? settings.aiDevMockEnabled;

  if (isMock) {
    if (isDevEnvironment() && isDevBridgeRunning()) {
      try {
        const taskId = enqueueDevTask("seo", {
          prompt: `Generate SEO metadata for "${title}": "${content.slice(0, 1000)}"`,
        });
        const result = await waitForDevTask(taskId);
        const parsed = JSON.parse(result);
        if (parsed.metaTitle && parsed.metaDescription) return parsed;
      } catch (err) {
        console.warn("Dev AI Bridge SEO fallback to mock:", err);
      }
    }
    return simulateSEOMetadata(title, content);
  }

  const prompt = `Analyze this article and generate optimal SEO metadata:
Title: "${title}"
Content:
"""
${content.slice(0, 2500)}
"""

Output STRICTLY valid JSON:
{
  "metaTitle": "Title max 60 chars",
  "metaDescription": "Description 140-160 chars",
  "metaKeywords": "comma, separated, keywords",
  "summary": "2-3 sentence executive summary",
  "readingTime": 5,
  "suggestedTags": ["Tag1", "Tag2"]
}`;

  try {
    const raw = await generateText(
      [
        { role: "system", content: "You output JSON only without markdown code fences." },
        { role: "user", content: prompt },
      ],
      options
    );

    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(clean);
  } catch {
    return simulateSEOMetadata(title, content);
  }
}
