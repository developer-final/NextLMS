/**
 * Recursive Text Chunker for RAG Pipelines
 * Implements semantic boundaries with context overlap.
 */

export interface ChunkOptions {
  chunkSize?: number; // Target characters per chunk (~4 chars = 1 token)
  chunkOverlap?: number; // Overlapping characters between consecutive chunks
  separators?: string[];
}

export interface ChunkResult {
  content: string;
  chunkIndex: number;
  characterCount: number;
}

const DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", "! ", "? ", "; ", " ", ""];

export function chunkText(
  text: string,
  options: ChunkOptions = {}
): ChunkResult[] {
  const chunkSize = options.chunkSize || 1000;
  const chunkOverlap = options.chunkOverlap || 150;
  const separators = options.separators || DEFAULT_SEPARATORS;

  const rawChunks: string[] = [];
  splitRecursively(text.trim(), separators, 0, chunkSize, rawChunks);

  // Merge small splits and add overlaps
  const results: ChunkResult[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const part of rawChunks) {
    if (!part.trim()) continue;

    if (currentChunk.length + part.length <= chunkSize) {
      currentChunk += (currentChunk ? "\n" : "") + part;
    } else {
      if (currentChunk) {
        results.push({
          content: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          characterCount: currentChunk.length,
        });

        // Compute overlap from end of current chunk
        const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        const overlapText = currentChunk.slice(overlapStart).trim();
        currentChunk = (overlapText ? overlapText + "\n" : "") + part;
      } else {
        // Part is larger than chunkSize itself
        results.push({
          content: part.trim(),
          chunkIndex: chunkIndex++,
          characterCount: part.length,
        });
        currentChunk = "";
      }
    }
  }

  if (currentChunk.trim()) {
    results.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex++,
      characterCount: currentChunk.length,
    });
  }

  return results;
}

function splitRecursively(
  text: string,
  separators: string[],
  sepIndex: number,
  maxSize: number,
  output: string[]
): void {
  if (text.length <= maxSize || sepIndex >= separators.length) {
    output.push(text);
    return;
  }

  const separator = separators[sepIndex];
  const parts = text.split(separator);

  for (const part of parts) {
    if (part.length <= maxSize) {
      output.push(part);
    } else {
      splitRecursively(part, separators, sepIndex + 1, maxSize, output);
    }
  }
}
