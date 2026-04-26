//ROUTES
import express from "express";
import { validateRequest } from "../../middleware/validate.js";
import { requirePermission, authenticate } from "../../middleware/auth.js";
import {
  getDocumentController,
  listDocumentsController,
  createDocumentController,
  deleteDocumentController,
  pollDocumentController
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, chunkCount]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc 
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

/**
 * @swagger
 * /documents/{docId}:
 *   get:
 *     summary: Get one document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: docId
 *         description: Id of the document
 *         required: true 
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document found
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Invalid document ID
 */
router.get(
  "/:docId",
  requirePermission("documents:read"),
  validateRequest(documentParamsSchema),
  getDocumentController,
);

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Create a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 example: The Great Catsby
 *               content:
 *                 type: string
 *                 example: Behold this is the famous story of cat
 *     responses:
 *       202:
 *         description: Document accepted for creation
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  requirePermission("documents:create"),
  validateRequest(createDocumentSchema),
  createDocumentController,
);

/**
 * @swagger
 * /documents/{docId}:
 *   delete:
 *     summary: delete a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: docId
 *         description: Id of the document
 *         required: true 
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted Document successfully
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Invalid document ID
 *       404:
 *         description: Document not found
 */
router.delete(
  "/:docId",
  requirePermission("documents:delete"/*,"admin:documents:delete"*/),
  validateRequest(documentParamsSchema),
  deleteDocumentController,
);

/**
 * @swagger
 * /documents/{id}/processing-status:
 *   get:
 *     summary: Poll job progress
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Id of the document
 *         required: true 
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returned poll result
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Invalid document ID
 *       404:
 *         description: Not found
 */
router.get(
  "/:id/processing-status",
  requirePermission("documents:read"),
  validateRequest(pollParamsSchema),
  pollDocumentController,
);

export default router;