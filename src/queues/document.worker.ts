import "dotenv/config";
import logger from "../configs/logger.config.js";
import { Job, Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { appEvents } from "../lib/events.js";
import { NotFoundError } from "../lib/errors.js";
import { splitIntoChunks, estimateTokens } from "../utils/chunker.js";
import { deadLetterQueue } from "./deadletter.queue.js";

const redis_host = process.env.REDIS_HOST! as string;
const redis_port = Number(process.env.REDIS_PORT!);

const worker = new Worker(
  "document-processing",
  async (job: Job) => {
    const { docId, userId } = job.data;
    logger.info(`Processing document ${docId} (attempt ${job.attemptsMade + 1})`);

    // Step 1: Fetch the document content
    const doc = await prisma.document.findUniqueOrThrow({
      where: { id: docId },
    });

    if (!doc) {
      throw new NotFoundError("Document not found");
    }

    // Mark as processing
    await prisma.document.update({
      where: { id: docId },
      data: {
        status: "processing",
      },
    });

    try {
      await job.updateProgress(10);

      // Step 2: Split into chunks
      const chunks = splitIntoChunks(doc.content, 500);
      await job.updateProgress(40);

      // Step 3: Store chunks in the database
      await prisma.$transaction(async (tx) => {
        // Delete any existing chunks (in case of retry)
        await tx.chunk.deleteMany({
          where: { documentId: docId },
        });

        await tx.chunk.createMany({
          data: chunks.map((text, index) => ({
            documentId: docId,
            index,
            content: text,
            tokenCount: estimateTokens(text),
          })),
        });

        await tx.document.update({
          where: { id: docId },
          data: {
            status: "ready",
            chunkCount: chunks.length,
          },
        });
        await job.updateProgress(100);

        // Emit event for audit/notification
        appEvents.emit("doc:processed", {
          docId,
          userId,
          chunkCount: chunks.length,
        });
      });

      return {
        success: true,
        chunks: chunks.length,
      };
    } catch (err) {
      // Only mark as failed on the LAST attempt
      if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
        await prisma.document.update({
          where: { id: docId },
          data: {
            status: "failed",
            error: (err as Error).message,
          },
        });
      }
      throw err; // Re-throw so BullMQ retries
    }
  },
  {
    connection: {
      host: redis_host,
      port: redis_port,
    },
    // 3 jobs can run concurrently i.e this worker processes up to 3 documents simultaneously.
    // If you have 10 documents in the queue, the worker handles 3 at a time. The rest wait.
    // Set based on server cpu and memory
    concurrency: 3,
  },
);

// Event listeners for logging
worker.on("completed", (job) => {
  logger.info(`Job ${job.id} completed: ${job.returnvalue?.chunks} chunks`);
});

worker.on("failed", async (job, error) => {
  if (!job) {
    return;
  }

  if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
    logger.error(
      `Job ${job?.id} failed permanently: ${error.message}. Moving to Dead Letter Queue`,
    );
  }

  await deadLetterQueue.add("failed-document", {
    originalJobId: job.id,
    originalQueue: "document-processing",
    data: job.data,
    error: error.message,
    failedAt: new Date().toISOString(),
    attempts: job.attemptsMade,
  });
});

worker.on("error", (error) => {
  logger.error("Worker error: ${error}");
});

export { worker };
