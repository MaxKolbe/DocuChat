//ROUTES
import express from "express";
import { authenticate, requirePermission } from "../../middleware/auth.js";
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
router.use(authenticate);

router.get(
  "/",
  requirePermission("conversations:read"),
  validateRequest(listConversationsSchema),
  listConversationsController,
);

router.post(
  "/",
  requirePermission("conversations:create"),
  validateRequest(createConversationSchema),
  createConverationController
);

router.post(
  "/:conversationId/messages",
  validateRequest(sendMessageSchema),
  sendMessageController,
);

export default router;
