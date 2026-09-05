import {
  generateBlogPostContent,
  generateSEOFromContent,
} from "../service";
import { searchSimilarChunks } from "../rag/vector-store";
import { SEOMetadata } from "../types";

export interface BlogPostInput {
  topic: string;
  tone?: string;
  keywords?: string;
  knowledgeDocIds?: string[];
}

export interface FullBlogPostResult {
  content: string;
  seo: SEOMetadata;
}

/**
 * Multi-Step Blog Agent: Generates content and optimized SEO metadata
 */
export async function runBlogPostAgent(
  input: BlogPostInput
): Promise<FullBlogPostResult> {
  let contextDocs: string[] = [];

  if (input.knowledgeDocIds && input.knowledgeDocIds.length > 0) {
    const chunks = await searchSimilarChunks(input.topic, {
      documentIds: input.knowledgeDocIds,
      limit: 5,
    });
    contextDocs = chunks.map((c) => c.content);
  }

  // 1. Generate full article content
  const content = await generateBlogPostContent(
    input.topic,
    input.tone || "Professional",
    input.keywords || "trading, finance, elearning",
    contextDocs
  );

  // 2. Extract SEO Metadata
  const seo = await generateSEOFromContent(input.topic, content);

  return { content, seo };
}
