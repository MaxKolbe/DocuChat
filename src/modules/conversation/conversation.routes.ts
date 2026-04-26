//ROUTES
import express from "express";
import { requirePermission } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  listConversationsSchema,
  createConversationSchema,
  sendMessageSchema,
} from "./conversation.schema.js";
import {
  listConversationsController,
  createConverationController,
  sendMessageController,
} from "./conversation.controller.js";

const router = express.Router();

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: List user's conversations
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of Conversations
 *       401:
 *         description: Not authenticated
 */
router.get(
  "/",
  requirePermission("conversations:read"),
  validateRequest(listConversationsSchema),
  listConversationsController,
);

/**
 * @swagger
 * /conversations:
 *   post:
 *     summary: Create a conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: New conversation
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  requirePermission("conversations:create"),
  validateRequest(createConversationSchema),
  createConverationController,
);

/**
 * @swagger
 * /conversations/{conversationId}/messages:
 *   post:
 *     summary: Sends a message in a conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: This is a new message in this conversation
 *                 required: true
 *               documentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Validation error
 */
router.post("/:conversationId/messages", validateRequest(sendMessageSchema), sendMessageController);

export default router;
