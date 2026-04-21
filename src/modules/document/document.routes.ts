//ROUTES
import express from "express";
import { validateRequest } from "../../middleware/validate.js";
import { requirePermission, authenticate } from "../../middleware/auth.js";
import {
  getDocumentController,
  postController,
  listDocumentsController,
  deleteDocumentController,
} from "./document.controller.js";
import {
  createDocumentSchema,
  listDocumentsSchema,
  documentParamsSchema,
} from "./document.schema.js";

const router = express.Router();
router.use(authenticate);

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
  "/:id",
  requirePermission("documents:read"),
  validateRequest(listDocumentsSchema),
  listDocumentsController,
);
router.get(
  "/:id",
  requirePermission("documents:read"),
  validateRequest(documentParamsSchema),
  getDocumentController,
);
router.delete(
  "/:documentId/:userId",
  requirePermission("documents:delete", "admin:documents:delete"),
  validateRequest(documentParamsSchema),
  deleteDocumentController,
);

router.post(
  "/",
  requirePermission("documents:create"),
  validateRequest(createDocumentSchema),
  postController,
);

export default router;
