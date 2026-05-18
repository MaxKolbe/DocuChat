import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { generateEmbeddingCached } from "./embedding.services.js";
import logger from "../configs/logger.config.js";

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  score: number; // Cosine similarity (0 to 1, higher = more similar)
  tokenCount: number;
}

export const semanticSearch = async (options: {
  query: string;
  userId: string;
  documentId?: string; // Optional: search within a specific document
  topK?: number;
  minScore?: number;
}): Promise<SearchResult[]> => {
  const { query, userId, documentId, topK = 10, minScore = 0.3 } = options;

  const startTime = Date.now();

  // Step 1: Embed the query
  const queryEmbedding = await generateEmbeddingCached(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Step 2: Search pgvector with ownership filter
  // check is _ affects naming: AS documentId AS tokenCount
  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT
        c.id AS "chunkId",
        c."document_id" AS "documentId",
        d.title AS "documentTitle",
        c.content,
        c.index AS "chunkIndex",
        c."token_count" AS "tokenCount",
        1 - (c.embedding <=> ${vectorStr}::vector) AS score 
    FROM "chunk" c 
    JOIN "document" d ON d.id = c."document_id" 
    WHERE d."user_id" = ${userId} 
      AND d."deletedAt" IS NULL 
      AND d.status = 'ready' 
      AND c.embedding IS NOT NULL 
      ${documentId ? Prisma.sql`AND d.id = ${documentId}` : Prisma.empty}
    ORDER BY c.embedding <=> ${vectorStr}::vector 
    LIMIT ${topK} 
  `;

  // Filter by minimum score
  const filtered = results.filter((r) => r.score >= minScore);

  const duration = Date.now() - startTime;

  logger.info("Semantic search completed", {
    query: query.substring(0, 100),
    totalResults: results.length,
    filteredResults: filtered.length,
    topScore: filtered[0]?.score?.toFixed(4),
    durationMs: duration,
    // correlationId,
  });

  return filtered;
};
