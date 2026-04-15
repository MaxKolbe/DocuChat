//ROUTES
import express from "express";
import { validateRequest} from "../../middleware/validate.js"
import { getController, postController, putController, deleteController } from "./conversation.controller.js";
const router = express.Router();

router.get("/", getController);
router.post("/", postController);
router.get("/:id/messages ", putController);
router.post("/:id/messages ", deleteController);

/* //request validation with zod 
import {featureSchema} from "./user.schema.js"
router.get("/", validatRequest(featureSchema), getController)
*/

export default router;
