//ROUTES
import express from "express";
import { validateRequest } from "../../middleware/validate.js";
import { requirePermission, authenticate } from "../../middleware/auth.js";
import {
  getDocumentController,
  listDocumentsController,
  createDocumentController,
  deleteDocumentController,
} from "./document.controller.js";
import {
  createDocumentSchema,
  listDocumentsSchema,
  documentParamsSchema,
  pollParamsSchema
} from "./document.schema.js";

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
  listDocumentsController,
);

router.get(
  "/:docId",
  requirePermission("documents:read"),
  validateRequest(documentParamsSchema),
  getDocumentController,
);

router.post(
  "/",
  requirePermission("documents:create"),
  validateRequest(createDocumentSchema),
  createDocumentController,
);

router.delete(
  "/:docId",
  requirePermission("documents:delete"/*,"admin:documents:delete"*/),
  validateRequest(documentParamsSchema),
  deleteDocumentController,
);

// poll job progress
router.get(
  "/:id/processing-status",
  requirePermission("documents:read"),
  validateRequest(pollParamsSchema),
  createDocumentController,
);

export default router;