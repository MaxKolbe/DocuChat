import logger from "../configs/logger.config.js";
import { prisma } from "../lib/prisma.js";
import { cacheGet, cacheDel, CACHE_TTL, cacheSet } from "../lib/cache.js";
export type TaskType = "chat" | "embedding" | "agent" | "summary";
import { AppError } from "../lib/errors.js";

export interface MCPRequest {
  taskType: TaskType;
  messages: { role: string; content: string }[];
  userId: string;
  correlationId: string;
  tools?: any[];
  maxTokens?: number;
  temperature?: number;
}

export interface MCPResponse {
  content: string;
  toolCalls?: any[];
  model: string;
  promptVersion: string;
  tokensUsed: { prompt: number; completion: number; total: number };
  costUsd: number;
  latencyMs: number;
  fallbackUsed: boolean;
}

const MONTHLY_BUDGETS: Record<string, number> = {
  free: 1.0,
  pro: 20.0,
  enterprise: 200.0,
};

async function enforceBudget(userId: string): Promise<void> {
  // Get user's tier
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  const budget = MONTHLY_BUDGETS[user?.tier || "free"] as number;

  // Sum this month's AI costs
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await prisma.usageLog.aggregate({
    where: {
      userId,
      action: { in: ["chat", "agent_run", "document_ingested"] },
      createdAt: { gte: startOfMonth },
    },
    _sum: { costUsd: true },
  });

  const spent = result._sum.costUsd || 0;

  if (spent >= budget) {
    throw new AppError(
      `Monthly AI budget exhausted ($${spent.toFixed(2)}/$${budget.toFixed(2)})`,
      429,
      "BUDGET_EXHAUSTED",
    );
  }
  // Warn at 80%
  if (spent >= budget * 0.8) {
    logger.warn("User approaching budget limit", {
      userId,
      spent: spent.toFixed(4),
      budget: budget.toFixed(2),
      percentUsed: ((spent / budget) * 100).toFixed(1),
    });
  }
}

async function resolvePrompt(taskType: TaskType): Promise<{ content: string; version: string }> {
  // Check cache first
  const cacheKey = `prompt:${taskType}:active`;
  const cached = await cacheGet<{ content: string; version: string }>(cacheKey);
  if (cached) return cached;
  // Load from database
  const prompt = await prisma.promptTemplate.findFirst({
    where: { taskType, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!prompt) {
    throw new Error(`No active prompt for task type: ${taskType}`);
  }
  const result = { content: prompt.content, version: prompt.version };
  await cacheSet(cacheKey, result, 300); // Cache for 5 minutes
  return result;
}

// Use to test two prompt versions
async function resolvePromptAB(
  taskType: TaskType,
  userId: string,
): Promise<{ content: string; version: string }> {
  const prompts = await prisma.promptTemplate.findMany({
    where: { taskType, isActive: true },
    orderBy: { version: "asc" },
  });

  if (prompts.length <= 1) {
    return resolvePrompt(taskType); // No A/B test running
  }

  // Deterministic split: hash the user ID to get a consistent bucket
  const hash = userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1);
  const index = hash % prompts.length;

  const selected = prompts[index];
  return { content: selected!.content, version: selected!.version };
}

// export async function mcpComplete(request: MCPRequest): Promise<MCPResponse> {
//   const startTime = Date.now();

//   // 1. Check budget
//   await enforceBudget(request.userId);

//   // 2. Resolve prompt version
//   const prompt = await resolvePrompt(request.taskType);

//   // 3. Select model
//   const model = await routeModel(request.taskType, request.messages);

//   // 4. Call with fallback
//   const result = await callWithFallback(model, {
//     ...request,
//     systemPrompt: prompt.content,
//   });

//   // 5. Track cost
//   const costUsd = calculateCost(result.model, result.usage);
//   await trackCost(request.userId, costUsd);

//   // 6. Audit log
//   await auditLog({
//     ...request,
//     model: result.model,
//     promptVersion: prompt.version,
//     costUsd,
//     latencyMs: Date.now() - startTime,
//   });

//   if (request.taskType === "chat") {
//     // Track Confidence level metric
//   }

//   return {
//     content: result.content,
//     toolCalls: result.toolCalls,
//     model: result.model,
//     promptVersion: prompt.version,
//     tokensUsed: result.usage,
//     costUsd,
//     latencyMs: Date.now() - startTime,
//     fallbackUsed: result.fallbackUsed,
//   };
// }

/** THE RAG SERVICE SHOULD MOVE FROM 
 * this: 
// Before: direct call 
const response = await openaiBreaker.fire('/chat/completions', { 
    model: 'gpt-4o', 
    messages, 
    temperature: 0.1, 
}); 
To this: 
// After: through MCP 
const response = await mcpComplete({ 
    taskType: 'chat', 
    messages, 
    userId, 
    correlationId, 
    temperature: 0.1, 
});
 */
