//ROUTES
import express from "express";
import { validateRequest} from "../../middleware/validate.js"
import { getController, postController, putController, deleteController } from "./document.controller.js";
import { createDocumentSchema } from "./document.schema.js";
const router = express.Router();

router.get("/", getController);
router.post("/", validateRequest(createDocumentSchema), postController);
router.get("/:id", putController);
router.delete("/:id", deleteController);

/* //request validation with zod 
import {featureSchema} from "./user.schema.js"
router.get("/", validatRequest(featureSchema), getController)
*/

export default router;
