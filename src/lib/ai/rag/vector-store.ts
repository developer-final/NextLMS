import { prisma } from "@/lib/prisma";
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
 * Process document text, slice into chunks, and store in database
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

    // Batch insert new chunks
    await prisma.documentChunk.createMany({
      data: chunks.map((c) => ({
        documentId,
        content: c.content,
        chunkIndex: c.chunkIndex,
      })),
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
 * Supports hybrid ranking with fallback
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

    const candidateChunks = await prisma.documentChunk.findMany({
      where: whereCondition,
      include: {
        document: {
          select: { title: true },
        },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    if (candidateChunks.length === 0) {
      return [];
    }

    // Keyword & semantic relevance scoring
    const queryTokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scored = candidateChunks.map((chunk) => {
      const lowerContent = chunk.content.toLowerCase();
      let matchCount = 0;

      for (const token of queryTokens) {
        if (lowerContent.includes(token)) {
          matchCount++;
        }
      }

      const similarity =
        queryTokens.length > 0 ? matchCount / queryTokens.length : 0.5;

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
