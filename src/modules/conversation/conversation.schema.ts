import { z } from "zod";

export const listConversationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const createConversationSchema = z.object({
  body: z.object({
    title: z.string().max(200).optional(),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({
    conversationId: z.uuid("Invalid conversation ID").optional(),
  }),
  body: z.object({
    content: z.string().min(1, "Message cannot be empty").max(10000, "Message too long"),
    documentId: z.uuid().optional(),
  }),
});

export type Createconversation = z.infer<typeof createConversationSchema>;
export type Sendmessage = z.infer<typeof sendMessageSchema>;
