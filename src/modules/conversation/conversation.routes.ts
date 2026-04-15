//ROUTES
import express from "express";
import { validateRequest } from "../../middleware/validate.js";
import { createConversationSchema, sendMessageSchema } from "./conversation.schema.js";
import { getController, postController } from "./conversation.controller.js";
const router = express.Router();

router.get("/", getController);
router.post("/", validateRequest(createConversationSchema), postController);
router.get("/:id/messages", getController);
router.post("/:id/messages", validateRequest(sendMessageSchema), postController);

/* //request validation with zod 
import {featureSchema} from "./user.schema.js"
router.get("/", validatRequest(featureSchema), getController)
*/

export default router;
