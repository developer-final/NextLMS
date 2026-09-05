import { describe, it, expect } from "vitest";
import {
  simulateCourseOutline,
  simulateLessonContent,
  simulateBlogPost,
  simulateSEOMetadata,
  simulateQuiz,
  simulateStreamText,
} from "./mock-proxy";

describe("Local Dev Simulation Mock Proxy", () => {
  it("should generate a structured CourseOutline with sections and lessons", () => {
    const outline = simulateCourseOutline(
      "Price Action Trading",
      "INTERMEDIATE",
      "Active Retail Traders"
    );

    expect(outline).toBeDefined();
    expect(outline.title).toContain("Price Action Trading");
    expect(outline.level).toBe("INTERMEDIATE");
    expect(outline.sections.length).toBeGreaterThan(0);

    const firstSection = outline.sections[0];
    expect(firstSection.lessons.length).toBeGreaterThan(0);

    const firstLesson = firstSection.lessons[0];
    expect(firstLesson.title).toBeDefined();
    expect(["ARTICLE", "VIDEO_YOUTUBE", "QUIZ"]).toContain(firstLesson.contentType);
  });

  it("should generate rich Markdown lesson content", () => {
    const content = simulateLessonContent(
      "Mastering Price Action",
      "Module 1: Foundations",
      "1.1 Market Structure Analysis"
    );

    expect(content).toBeDefined();
    expect(content).toContain("# 1.1 Market Structure Analysis");
    expect(content).toContain("## 1. Overview & Learning Objectives");
    expect(content).toContain("## 2. Core Concepts");
  });

  it("should generate comprehensive blog post", () => {
    const blog = simulateBlogPost(
      "Risk Management in Volatile Markets",
      "Professional",
      "risk, trading, stoploss"
    );

    expect(blog).toBeDefined();
    expect(blog).toContain("# Risk Management in Volatile Markets");
    expect(blog).toContain("## 1. The Shifting Paradigm");
    expect(blog).toContain("## 3. Conclusion");
  });

  it("should generate valid SEO metadata", () => {
    const seo = simulateSEOMetadata(
      "5 Secrets of Successful Crypto Trading",
      "This is a comprehensive article about cryptocurrency trading strategies, risk management, and market liquidity."
    );

    expect(seo).toBeDefined();
    expect(seo.metaTitle).toContain("5 Secrets");
    expect(seo.metaDescription.length).toBeGreaterThan(20);
    expect(seo.metaKeywords).toBeDefined();
    expect(seo.readingTime).toBeGreaterThanOrEqual(1);
    expect(seo.suggestedTags.length).toBeGreaterThan(0);
  });

  it("should generate valid quiz questions with 4 options and valid answer index", () => {
    const quiz = simulateQuiz("Lesson content about risk management", 5);

    expect(quiz).toHaveLength(5);
    for (const q of quiz) {
      expect(q.question).toBeDefined();
      expect(q.options).toHaveLength(4);
      expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctAnswerIndex).toBeLessThan(4);
      expect(q.explanation).toBeDefined();
    }
  });

  it("should stream text chunk by chunk", async () => {
    const fullText = "NextLMS AI Copilot streaming test.";
    const chunks: string[] = [];

    for await (const chunk of simulateStreamText(fullText, 0)) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toBe(fullText);
  });
});
