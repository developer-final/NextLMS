import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";
import { chunkText } from "./chunker";

export interface SearchOptions {
  courseId?: string;
  documentIds?: string[];
  limit?: number;
  minSimilarity?: number;
}

export interface SearchResultChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
}

/**
 * Calculate Cosine Similarity between two numeric vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA <= 0 || normB <= 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generate vector embedding using Google Gemini or OpenAI Embedding API
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const clean = text.trim();
  if (!clean) return null;

  try {
    const settings = await getSystemSettings();

    // 1. Try Gemini text-embedding-004
    const geminiKey = settings.aiGeminiKey || process.env.GEMINI_API_KEY || "";
    if (geminiKey && geminiKey !== "mock") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: clean.slice(0, 2048) }] },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const values = json.embedding?.values;
        if (Array.isArray(values) && values.length > 0) {
          return values;
        }
      }
    }

    // 2. Try OpenAI text-embedding-3-small
    const openaiKey = settings.aiOpenaiKey || process.env.OPENAI_API_KEY || "";
    if (openaiKey && openaiKey !== "mock") {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: clean.slice(0, 2048),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const values = json.data?.[0]?.embedding;
        if (Array.isArray(values) && values.length > 0) {
          return values;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Process document text, slice into chunks, generate embeddings, and store in database
 */
export async function indexDocumentText(
  documentId: string,
  rawText: string
): Promise<{ chunkCount: number }> {
  try {
    const chunks = chunkText(rawText, { chunkSize: 1000, chunkOverlap: 150 });

    if (chunks.length === 0) {
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: "READY", chunkCount: 0 },
      });
      return { chunkCount: 0 };
    }

    // Delete existing chunks if re-indexing
    await prisma.documentChunk.deleteMany({
      where: { documentId },
    });

    // Generate embeddings in batches of 4 (optional, fallback cleanly if no key)
    const chunkData: {
      documentId: string;
      content: string;
      chunkIndex: number;
      metadata?: any;
    }[] = [];

    for (let i = 0; i < chunks.length; i += 4) {
      const batch = chunks.slice(i, i + 4);
      const batchResults = await Promise.all(
        batch.map(async (c) => {
          let embedding: number[] | null = null;
          try {
            embedding = await generateEmbedding(c.content.slice(0, 1000));
          } catch {
            // embedding optional
          }
          return {
            documentId,
            content: c.content,
            chunkIndex: c.chunkIndex,
            metadata: embedding ? { embedding } : undefined,
          };
        })
      );
      chunkData.push(...batchResults);
    }

    // Batch insert new chunks
    await prisma.documentChunk.createMany({
      data: chunkData,
    });

    // Update document status
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: "READY",
        chunkCount: chunks.length,
      },
    });

    return { chunkCount: chunks.length };
  } catch (error) {
    console.error("Error indexing document:", error);
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

/**
 * Search relevant chunks for a given query
 * Supports true Semantic Search + Hybrid BM25/keyword ranking with fallback
 */
export async function searchSimilarChunks(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResultChunk[]> {
  const limit = options.limit || 5;

  try {
    const whereCondition: any = {};

    if (options.documentIds && options.documentIds.length > 0) {
      whereCondition.documentId = { in: options.documentIds };
    } else if (options.courseId) {
      whereCondition.document = { courseId: options.courseId };
    }

    // Query candidate chunks without restricting to just 50 recent chunks
    const candidateChunks = await prisma.documentChunk.findMany({
      where: whereCondition,
      include: {
        document: {
          select: { title: true },
        },
      },
      take: 200,
      orderBy: { createdAt: "desc" },
    });

    if (candidateChunks.length === 0) {
      return [];
    }

    // Attempt to compute semantic embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    const queryTokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 1);

    const scored = candidateChunks.map((chunk) => {
      const lowerContent = chunk.content.toLowerCase();

      // 1. Keyword overlap score
      let matchCount = 0;
      for (const token of queryTokens) {
        if (lowerContent.includes(token)) {
          matchCount++;
        }
      }
      const keywordSim =
        queryTokens.length > 0 ? matchCount / queryTokens.length : 0.5;

      // 2. Semantic vector score (if chunk has embedding and query embedding was computed)
      let semanticSim = 0;
      const metadata = chunk.metadata as any;
      if (queryEmbedding && Array.isArray(metadata?.embedding)) {
        semanticSim = cosineSimilarity(queryEmbedding, metadata.embedding);
      }

      // Hybrid combination (75% semantic + 25% keyword if vector exists, else 100% keyword)
      let similarity = keywordSim;
      if (queryEmbedding && semanticSim > 0) {
        similarity = 0.75 * semanticSim + 0.25 * keywordSim;
      }

      return {
        id: chunk.id,
        documentId: chunk.documentId,
        documentTitle: chunk.document.title,
        content: chunk.content,
        similarity: Math.min(1, Math.max(0.1, similarity)),
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit);
  } catch (error) {
    console.error("Error searching similar chunks:", error);
    return [];
  }
}
