//ROUTES
import express from "express";
import { validateRequest } from "../../middleware/validate.js";
import { getController, postController, deleteController } from "./document.controller.js";
import {
  createDocumentSchema,
  listDocumentsSchema,
  documentParamsSchema,
} from "./document.schema.js";
import { requirePermission, authenticate } from "../auth/auth.middleware.js";
const router = express.Router();

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: List user's documents
 *     tags: [Documents]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, ready, failed]
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Not authenticated
 */
router.get(
  "/",
  requirePermission("documents:read"),
  validateRequest(listDocumentsSchema),
  getController,
);
router.post(
  "/",
  requirePermission("documents:create"),
  validateRequest(createDocumentSchema),
  postController,
);
router.get(
  "/:id",
  requirePermission("documents:read"),
  validateRequest(documentParamsSchema),
  getController,
);
router.delete(
  "/:id",
  requirePermission("documents:delete", "admin:documents:delete"),
  validateRequest(documentParamsSchema),
  deleteController,
);

export default router;
