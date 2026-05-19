import { ToolDefinition } from "./index.js";
import { searchDocumentsTool } from "./searchDocuments.js";
import { finalAnswerTool } from "./finalAnswer.js";
import { toJSONSchema} from "zod"

// Add more tools here as you build them

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  search_documents: searchDocumentsTool,
  // get_document_summary: documentSummaryTool,
  // analyze_chunks: analyzeChunksTool,
  final_answer: finalAnswerTool,
};

// Convert to OpenAI function calling format
export function getToolSchemas() {
  return Object.values(TOOL_REGISTRY)
    .filter((t) => t.name !== "final_answer") // final_answer handled separately
    .map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: toJSONSchema(tool.parameters),
      },
    }));
}
