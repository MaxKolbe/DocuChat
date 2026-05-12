import logger from "../configs/logger.config.js";
import { appEvents } from "../lib/events.js";
import { prisma } from "../lib/prisma.js";

appEvents.on("ai:embedding-generated", async (data) => {
  try {
    await prisma.usageLog.create({
      data: {
        userId: data.userId,
        action: "embed",
        tokens: data.tokensUsed,
        costUsd: data.costUsd,
        metadata: JSON.stringify({
          model: data.model,
          cached: data.cached,
        }),
        correlationId: data.correlationId,
      },
    });
  } catch (error) {
    logger.error(`Failed to log embed action to usagelogs`, { error });
  }
});
