// Document aggregate: upload, list, get, delete
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import { getUserPermissions } from "../utils/rbac.service.js";
import { Listdocuments } from "../modules/document/document.schema.js"; // type
import { appEvents } from "../lib/events.js";
import { DOC_EVENTS } from "../events/document.events.js";
import { queueDocumentForProcessing } from "../queues/document.queue.js";

// options: Listdocuments..apparently not a good idea since zod creates literal types from enums
export const listDocuments = async (userId: string, options: any) => {
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
    meta: { page, limit, total },
  };
};

export const getDocument = async (docId: string, userId: string) => {
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
  };
};

export const createDocument = async (userId: string, body: { title: string; content: string }) => {
  const { title, content } = body;

  const newDocument = await prisma.document.create({
    data: {
      userId,
      title,
      filename: title.toLowerCase().replace(/\s+/g, '-'),
      content,
      status: 'pending',
    },
  });

  // Queue for background processing 
  const jobId = await queueDocumentForProcessing(newDocument.id, userId);

  appEvents.emit(DOC_EVENTS.CREATED, {
    userId,
    documentId: newDocument.id,
    title: newDocument.title,
    // fileSizeBytes: newDocument.fileSizeBytes,
  });

  return {
    code: 202,
    message: "document Accepted! (still processing)",
    data: {
      newDocument,
      jobId
    },
  };
};

export const deleteDocument = async (docId: string, userId: string) => {
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
  });

  return prisma.document.update({
    where: { id: docId },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
    },
  });
};
