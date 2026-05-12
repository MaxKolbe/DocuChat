// Conversation aggregate: create, list, sendMessage
import { NotFoundError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { semanticSearch } from "./search.service.js";
import { assembleContext, generateRAGResponse } from "./rag.service.js";

export const listConversations = async (
  userId: string,
  options: {
    page: number;
    limit: number;
  },
  correlationId: string,
) => {
  const { page, limit } = options;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // only the latest message
          select: {
            content: true,
            role: true,
            createdAt: true,
          },
        },
      },
    }),

    prisma.conversation.count({ where: { userId } }),
  ]);

  return {
    message: "Conversations found successfully",
    data: conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      // messageCount: conv._count.messages,
      lastMessage: conv.messages[0] || null,
      updatedAt: conv.updatedAt,
    })),
    meta: {
      page,
      limit,
      total,
      correlationId,
    },
  };
};

export const createConversation = async (userId: string, title: string, correlationId: string) => {
  const newConversation = await prisma.conversation.create({
    data: {
      userId,
      title,
    },
  });

  return {
    code: 201,
    message: "Conversation created successfully",
    data: newConversation,
    meta: { correlationId },
  };
};

export const sendMessage = async (data: {
  conversationId: string;
  userId: string;
  content: string;
  documentId?: string;
  correlationId: string;
}) => {
  return prisma.$transaction(async (tx) => {
    // 1. Verify conversation ownership (same as before)
    const conversation = await tx.conversation.findUnique({
      where: { id: data.conversationId },
    });
    if (!conversation || conversation.userId !== data.userId) {
      throw new NotFoundError("Conversation not found");
    }

    // 2. Save user message
    const userMessage = await tx.message.create({
      data: {
        conversationId: data.conversationId,
        documentId: data.documentId ?? null,
        role: "user",
        content: data.content,
      },
    });

    // 3. Load recent conversation history
    const history = await tx.message.findMany({
      where: { conversationId: data.conversationId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { role: true, content: true },
    });
    const conversationHistory = history.reverse();

    // 4. RAG: Retrieve
    let searchResults;
    if (data.documentId) {
      searchResults = await semanticSearch({
        query: data.content,
        userId: data.userId,
        documentId: data.documentId,
      });
    } else {
      searchResults = await semanticSearch({
        query: data.content,
        userId: data.userId,
      });
    }

    // 5. RAG: Augment
    const context = assembleContext(searchResults);

    // 6. RAG: Generate
    const ragResponse = await generateRAGResponse({
      question: data.content,
      context,
      conversationHistory,
      userId: data.userId,
      conversationId: data.conversationId,
      correlationId: data.correlationId,
    });

    // 7. Save assistant message with metadata
    const assistantMessage = await tx.message.create({
      data: {
        conversationId: data.conversationId,
        documentId: data.documentId ?? null,
        role: "assistant",
        content: ragResponse.answer,
        promptTokens: ragResponse.tokensUsed.prompt,
        completionTokens: ragResponse.tokensUsed.completion,
        costUsd: ragResponse.costUsd,
        metadata: JSON.stringify({
          model: ragResponse.model,
          citations: ragResponse.citations,
          contextChunks: context.chunks.length,
        }),
      },
    });

    // 8. Touch conversation updatedAt
    await tx.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      code: 200,
      message: "Message sent successfully",
      data: {
        userMessage,
        assistantMessage: {
          ...assistantMessage,
          citations: ragResponse.citations,
        },
      },
      meta: {
        correlationId: data.correlationId
      }
    };
  });
};
