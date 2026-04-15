//ROUTES
import express from "express";
import { validateRequest } from "../../middleware/validate.js";
import {
  getController,
  postController,
  deleteController,
} from "./document.controller.js";
import {
  createDocumentSchema, 
  listDocumentsSchema,
  documentParamsSchema,
} from "./document.schema.js";
const router = express.Router();

router.get("/", validateRequest(listDocumentsSchema), getController);
router.post("/", validateRequest(createDocumentSchema), postController);
router.get("/:id", validateRequest(documentParamsSchema), getController);
router.delete("/:id", validateRequest(documentParamsSchema), deleteController);

export default router;
