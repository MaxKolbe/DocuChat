import { appEvents } from "../lib/events.js";
import { cacheDel } from "../lib/cache.js";
import logger from "../configs/logger.config.js";

// When a role changes, revoke the permissions cache for that user
appEvents.on("admin:role-assigned", async (data) => {
  try {
    await cacheDel(`docuchat:permissions:${data.targetUserId}`);
    logger.info(`Cache cleared: cleared permissions for ${data.targetUserId}`, {
      targetUserId: data.targetUserId,
      correlationId: data.correlationId,
    });
  } catch (err) {
    logger.error(`'Failed to bust permissions cache`, { err, correlationId: data.correlationId });
  }
});

appEvents.on("admin:role-revoked", async (data) => {
  try {
    await cacheDel(`docuchat:permissions:${data.targetUserId}`);
    logger.info(`Cache cleared: cleared permissions for ${data.targetUserId}`, {
      targetUserId: data.targetUserId,
      correlationId: data.correlationId,
    });
  } catch (err) {
    logger.error(`Failed to bust permissions cache`, { err, correlationId: data.correlationId });
  }
});

// When a document is updated or deleted, bust its cache
appEvents.on("doc:deleted", async (data) => {
  try {
    await cacheDel(`docuchat:doc:${data.documentId}`);
    logger.info(`Cache cleared: cleared document ${data.documentId}`, {
      documentId: data.documentId,
      correlationId: data.correlationId,
    });
  } catch (err) {
    logger.error(`Failed to bust document cache`, { err, correlationId: data.correlationId });
  }
});
