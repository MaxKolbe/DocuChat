// Conversation aggregate: create, list, sendMessage
import { NotFoundError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

export const listConversations = async (
  userId: string,
  options: {
    page: number;
    limit: number;
  },
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
    },
  };
};

export const sendMessage = async (
  conversationId: string,
  userId: string,
  content: string,
  documentId: string,
) => {
  const doc = await prisma.document.findUnique({ where: { id: documentId, deletedAt: null } });
  if (!doc) {
    throw new NotFoundError("Document not found");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Verify the conversation belongs to this user
    const conversation = tx.conversation.findUnique({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    // 2. Create the user's message
    const userMessage = tx.message.create({
      data: {
        conversationId,
        documentId,
        role: "user",
        content,
      },
    });

    // 3. Touch the conversation's updatedAt
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 4. In Week 4, this is where the RAG pipeline runs.
    // For now, we'll create a placeholder assistant message.
    const assistantMessage = await tx.message.create({
      data: {
        conversationId,
        documentId,
        role: "assistant",
        content: "AI response placeholder till WEEK 4",
        promptTokens: 0,
        completionTokens: 0,
        costUsd: 0,
      },
    });

    // 5. Log usage
    await tx.usageLog.create({
      data: {
        userId,
        action: "chat",
        tokens: 0, // placeholder till WEEK 4
        costUsd: 0,
      },
    });

    return {
      data: {
        userMessage,
        assistantMessage,
      },
    };
  });
};
