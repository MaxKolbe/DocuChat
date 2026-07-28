import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { semanticSearch } from "../services/search.service.js";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import logger from "../configs/logger.config.js";

export const mcpServer = new McpServer({
  name: "docuchat",
  version: "1.0.0",
});

// Tool 1: Semantic search across documents
mcpServer.registerTool(
  "search_documents",
  {
    title: "Search Documents",
    description:
      "Search across uploaded documents for information relevant to a query. Returns the most relevant text passages with similarity scores.",
    inputSchema: {
      query: z.string().min(3).describe("What to search for"),
      // documentId: z.uuid().describe("Optional: limit search to a specific document"), //.optional() can be optional but has to come last
      topK: z.number().int().min(1).max(10).default(5).describe("Number of results to return"),
      documentId: z.uuid().optional().describe("Optional: limit search to a specific document"),
    },
  },
  async ({ query, topK, documentId }) => {
    // userId comes from the authenticated session (see Lesson 5)
    const userId = ""; // getCurrentUserId();
    const results = await semanticSearch({
      query,
      userId,
      topK,
      documentId,
    });
    logger.info("MCP tool: search_documents", {
      query: query.substring(0, 100),
      results: results.length,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              results: results.map((r) => ({
                document: r.documentTitle,
                content: r.content,
                score: r.score.toFixed(4),
                chunkIndex: r.chunkIndex,
              })),
              totalResults: results.length,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// Tool 2: List user's documents
mcpServer.registerTool(
  "list_documents",
  {
    title: "",
    description: "List all uploaded documents with their processing status.",
  },
  async () => {
    const userId = ""; //getCurrentUserId();

    const docs = await prisma.document.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        chunkCount: true,
        createdAt: true,
      },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(docs, null, 2),
        },
      ],
    };
  },
);
