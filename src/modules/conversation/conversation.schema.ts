import { z } from "zod";

export const createConversationSchema = z.object({
  body: z.object({
    title: z.string().max(200).optional(),
    documentId: z.uuid().optional(),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid ID").optional(),
    /** */
    userId: z.uuid("Invalid user ID").optional(),
    conversationId: z.uuid("Invalid conversation ID").optional(),
    documentId: z.uuid("Invalid document ID").optional(),
    /** */
  }),
  body: z.object({
    content: z.string().min(1, "Message cannot be empty").max(10000, "Message too long"),
    documentId: z.uuid().optional(),
  }),
});

export type Createconversation = z.infer<typeof createConversationSchema>;
export type Sendmessage = z.infer<typeof sendMessageSchema>;
