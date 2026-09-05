import { describe, it, expect } from "vitest";
import { chunkText } from "./chunker";

describe("RAG Recursive Text Chunker", () => {
  it("should split long text into multiple chunks with overlap", () => {
    const longParagraph = "NextLMS is an academy platform. ".repeat(40);
    const chunks = chunkText(longParagraph, {
      chunkSize: 200,
      chunkOverlap: 50,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[1].chunkIndex).toBe(1);

    // Verify chunk boundaries
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(250); // slight buffer for word boundary
      expect(chunk.characterCount).toBeGreaterThan(0);
    }
  });

  it("should keep short text in a single chunk", () => {
    const shortText = "NextLMS modern e-learning academy.";
    const chunks = chunkText(shortText, { chunkSize: 500, chunkOverlap: 50 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(shortText);
    expect(chunks[0].chunkIndex).toBe(0);
  });
});
