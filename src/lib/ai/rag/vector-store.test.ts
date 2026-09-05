import { describe, it, expect, vi } from "vitest";
import { cosineSimilarity, generateEmbedding } from "./vector-store";

describe("RAG Vector Store & Similarity Calculations", () => {
  it("should calculate correct cosine similarity for identical vectors", () => {
    const vecA = [1, 2, 3];
    const vecB = [1, 2, 3];
    const sim = cosineSimilarity(vecA, vecB);
    expect(sim).toBeCloseTo(1.0, 5);
  });

  it("should calculate correct cosine similarity for orthogonal vectors", () => {
    const vecA = [1, 0, 0];
    const vecB = [0, 1, 0];
    const sim = cosineSimilarity(vecA, vecB);
    expect(sim).toBeCloseTo(0.0, 5);
  });

  it("should calculate correct cosine similarity for opposite vectors", () => {
    const vecA = [1, 1];
    const vecB = [-1, -1];
    const sim = cosineSimilarity(vecA, vecB);
    expect(sim).toBeCloseTo(-1.0, 5);
  });

  it("should handle empty or zero-norm vectors safely without throwing", () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
    expect(cosineSimilarity([1, 2], [1])).toBe(0);
  });

  it("should return null for empty text in generateEmbedding", async () => {
    const result = await generateEmbedding("   ");
    expect(result).toBeNull();
  });
});
