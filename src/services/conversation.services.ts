// Conversation aggregate: create, list, sendMessage
import { title } from "node:process";
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
          orderBy: {createdAt: 'desc'},
          take: 1, // only the latest message
          select: {
            content: true, 
            role: true,
            createdAt: true
          }
        }
      }
    }),

    prisma.conversation.count({where: {userId}})
  ]);

  return {
    message: "Conversations found successfully",
    data: conversations.map(conv => ({
      id: conv.id, 
      title: conv.title,
      // messageCount: conv._count.messages,
      lastMessage: conv.messages[0] || null, 
      updatedAt: conv.updatedAt
    })),
    meta: {
      page,
      limit,
      total
    }
  }
};

export const getService = async () => {
  return null;
};

export const createService = async () => {
  return null;
};

export const updateService = async () => {
  return null;
};

export const deleteService = async () => {
  return null;
};
