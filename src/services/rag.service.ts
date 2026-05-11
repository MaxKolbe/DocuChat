import { SearchResult } from "./search.service.js";

interface Citation {
  index: number; // [1], [2], etc.
  chunkId: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  score: number;
}

interface AssembledContext {
  chunks: SearchResult[];
  contextText: string;
  totalTokens: number;
  citations: Citation[];
}

const CONTEXT_TOKEN_BUDGET = 3500;

export const assembleContext = (searchResults: SearchResult[]): AssembledContext => {
  const selected: SearchResult[] = [];
  let totalTokens = 0;

  // Results are already sorted by score (descending)
  for (const result of searchResults) {
    if (totalTokens + result.tokenCount > CONTEXT_TOKEN_BUDGET) {
      break; // Budget exhausted
    }
    selected.push(result);
    totalTokens += result.tokenCount;
  }

  // Build citations
  const citations: Citation[] = selected.map((chunk, i) => ({
    index: i + 1,
    chunkId: chunk.chunkId,
    documentId: chunk.documentId,
    documentTitle: chunk.documentTitle,
    chunkIndex: chunk.chunkIndex,
    score: chunk.score,
  }));

  // Build the context text block
  const contextText = selected
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: "${chunk.documentTitle}", Section ${
          chunk.chunkIndex + 1
        }]\n${chunk.content}`,
    )
    .join("\n\n---\n\n");

  return {
    chunks: selected,
    contextText,
    totalTokens,
    citations,
  };
};
