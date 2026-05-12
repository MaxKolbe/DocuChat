// Document aggregate: upload, list, get, delete
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { getUserPermissions } from "../utils/rbac.service.js";
import { appEvents } from "../lib/events.js";
import { DOC_EVENTS } from "../events/document.events.js";
import { detectFormat, extractText } from "../lib/documentExtractor.js";
import { queueDocumentForProcessing, documentQueue } from "../queues/document.queue.js";
import { Request } from "express";

// options: Listdocuments..apparently not a good idea since zod creates literal types from enums
export const listDocuments = async (userId: string, options: any, correlationId: string) => {
  const { page, limit, status, search, sortBy, sortOrder } = options;
  // const sortby = sortBy as string;

  // Build the where clause dynamically
  const where: any = {
    userId,
    deletedAt: null, // Soft delete filter
  };

  if (status) {
    where.title = { contains: search, mode: "insensitive" };
    where.description = { contains: search, mode: "insensitive" };
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        filename: true,
        status: true,
        chunkCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    code: 200,
    message: "Documents listed succcessfully",
    data: documents,
    meta: { page, limit, total, correlationId },
  };
};

export const getDocument = async (docId: string, userId: string, correlationId: string) => {
  const doc = await prisma.document.findUnique({
    where: {
      id: docId,
      deletedAt: null /* Soft delete filter */,
    },
  });

  if (!doc) {
    throw new NotFoundError("Document not found");
  }

  // Resource ownership check
  if (doc.userId !== userId) {
    // Admins can see everything
    const permissions = await getUserPermissions(userId);
    if (!permissions.has("users:manage")) {
      throw new NotFoundError("Document not found");
    }
  }

  return {
    code: 200,
    message: "document found successfully",
    data: doc,
    meta: { correlationId },
  };
};

export const createDocument = async (req: Request, userId: string, correlationId: string) => {
  if (!req.file) {
    throw new ValidationError("Document not provided");
  }

  const content = await extractText(req.file.buffer, detectFormat(req.file.originalname)); 
  
  const newDocument = await prisma.document.create({
    data: {
      userId,
      title: req.file.originalname.split(".")[0]!,
      filename: req.file.originalname.toLowerCase().replace(/\s+/g, "-"),
      content: content.text,
      status: "pending",
    },
  });

  // Queue for background processing
  const jobId = await queueDocumentForProcessing(newDocument.id, userId, correlationId, content.text, content.pageCount);

  appEvents.emit(DOC_EVENTS.CREATED, {
    userId,
    documentId: newDocument.id,
    title: newDocument.title,
    // fileSizeBytes: newDocument.fileSizeBytes,
    correlationId,
  });

  return {
    code: 202,
    message: "document Accepted! (still processing)",
    data: {
      newDocument,
      jobId,
    },
    meta: { correlationId },
  };
};

export const deleteDocument = async (docId: string, userId: string, correlationId: string) => {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
  });

  if (!doc || doc.deletedAt) {
    throw new NotFoundError("Document not found");
  }

  // Ownership check
  if (doc.userId !== userId) {
    throw new NotFoundError("Document not found");
  }

  // Event emitter
  appEvents.emit(DOC_EVENTS.DELETED, {
    deletedBy: userId,
    documentId: doc.id,
    title: doc.title,
    correlationId,
  });

  return prisma.document.update({
    where: { id: docId },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
    },
  });
};

export const pollDocument = async (docId: string, userId: string, correlationId: string) => {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    select: { id: true, status: true, error: true, userId: true },
  });

  if (!doc || doc.userId !== userId) {
    throw new NotFoundError("Document not found");
  }

  // Try to find the active job for this document
  const jobs = await documentQueue.getJobs(["active", "waiting"]);
  const activeJob = jobs.find((j) => j.data.documentId === docId);

  return {
    code: 200,
    message: "Returned pool result successfully",
    data: {
      status: doc.status,
      error: doc.error,
      progress: activeJob ? await activeJob.progress : null,
    },
    meta: { correlationId },
  };
};
