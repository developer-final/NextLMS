/**
 * AI Service Type Definitions
 * Supports Multi-Provider LLM & Local Simulation Proxy
 */

export type AIProvider =
  | "gemini"
  | "openai"
  | "claude"
  | "deepseek"
  | "glm"
  | "moonshot";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  devMockEnabled?: boolean;
  apiKey?: string;
  contextDocs?: string[];
}

export interface StreamEvent {
  type: "chunk" | "error" | "done";
  content?: string;
  error?: string;
}

export interface CourseOutlineLesson {
  title: string;
  description: string;
  contentType: "ARTICLE" | "VIDEO_YOUTUBE" | "QUIZ";
}

export interface CourseOutlineSection {
  title: string;
  description?: string;
  lessons: CourseOutlineLesson[];
}

export interface CourseOutline {
  title: string;
  description: string;
  targetAudience: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  sections: CourseOutlineSection[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface SEOMetadata {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  summary: string;
  readingTime: number;
  suggestedTags: string[];
}

export interface ProviderConnectionTestResult {
  success: boolean;
  provider: AIProvider;
  message?: string;
  error?: string;
}
