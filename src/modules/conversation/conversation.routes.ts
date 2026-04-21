//ROUTES
import express from "express";
import { authenticate } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validate.js";
import { createConversationSchema, sendMessageSchema } from "./conversation.schema.js";
import { listConversationsController, sendMessageController } from "./conversation.controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/:userId", listConversationsController);
router.post("/:userId/:conversationId/messages/:documentId", validateRequest(sendMessageSchema), sendMessageController);
// router.post("/", validateRequest(createConversationSchema), );
// router.get("/:id/messages", );

export default router;
