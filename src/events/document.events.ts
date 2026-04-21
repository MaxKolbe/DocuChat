import logger from "../configs/logger.config.js";
import { appEvents } from "../lib/events.js";
import { prisma } from "../lib/prisma.js";

export const DOC_EVENTS = {
  CREATED: "doc:created",
  PROCESSED: "doc:processed",
  DELETED: "doc:deleted",
} as const;

appEvents.on(DOC_EVENTS.CREATED, async (data) => {
  try {
    await prisma.usageLog.create({
      data: {
        userId: data.userId,
        action: "document_created",
        tokens: 0,
        costUsd: 0,
        metadata: JSON.stringify({
          documentId: data.documentId,
          title: data.title,
          fileSizeBytes: data.fileSizeBytes,
        }),
      },
    });
  } catch (err) {
    logger.error(`Failed to log document creation: ${err}`);
  }
});

appEvents.on(DOC_EVENTS.PROCESSED, async (data) => {
  try {
    await prisma.usageLog.create({
      data: {
        userId: data.userId,
        action: "document_processed",
        tokens: 0,
        costUsd: 0,
        metadata: JSON.stringify({
          documentId: data.documentId,
          title: data.title,
          fileSizeBytes: data.fileSizeBytes,
        }),
      },
    });
  } catch (err) {}
});

appEvents.on(DOC_EVENTS.DELETED, async (data) => {
  try {
    await prisma.usageLog.create({
      data: {
        userId: data.deletedBy,
        action: "document_deleted",
        tokens: 0,
        costUsd: 0,
        metadata: JSON.stringify({
          documentId: data.documentId,
          title: data.title,
          deletedAt: new Date().toISOString(),
        }),
      },
    });
  } catch (err) {
    logger.error(`Failed to log document deletion: ${err}`);
  }
});
