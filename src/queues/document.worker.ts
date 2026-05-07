import "dotenv/config";
import { Job, Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { appEvents } from "../lib/events.js";
import { NotFoundError } from "../lib/errors.js";
import {
  generateEmbeddingsBatchCached,
  storeChunkEmbeddingsBatch,
} from "../services/embedding.services.js";
import { chunkDocument, splitIntoChunks, estimateTokens } from "../utils/chunker.js";
import { extractText, detectFormat } from "../lib/documentExtractor.js";
import { deadLetterQueue } from "./deadletter.queue.js";
import logger from "../configs/logger.config.js";

const redis_host = process.env.REDIS_HOST! as string;
const redis_port = Number(process.env.REDIS_PORT!);

const worker = new Worker(
  "document-processing",
  async (job: Job) => {
    const { docId, userId, correlationId } = job.data;
    const startTime = Date.now();

    // logger.info(`Processing document ${docId} (attempt ${job.attemptsMade + 1})`)
    logger.info(`Document processing started`, {
      documentId: docId,
      attempts: job.attemptsMade + 1,
      correlationId,
    });

    // Mark as processing
    await prisma.document.update({
      where: { id: docId },
      data: {
        status: "processing",
      },
    });

    try {
      // Step 1: Fetch the document
      const doc = await prisma.document.findUniqueOrThrow({
        where: { id: docId },
      });

      // if (!doc) {
      //   throw new NotFoundError("Document not found");
      // }

      await job.updateProgress(5);

      // Step 2: Extract text
      const format = detectFormat(doc.filename);
      const { text, pageCount } = await extractText(doc.content, format);

      logger.info(`Text extracted`, {
        documentId: docId,
        correlationId,
        format,
        textLength: text.length,
        pageCount,
      });

      // Step 3: Chunk the text
      const chunks = chunkDocument(text, {
        maxTokens: 500,
        overlapTokens: 50,
        minChunkTokens: 50,
      });
      await job.updateProgress(30);

      logger.info(`Document chunked`, {
        correlationId,
        chunkCount: chunks.length,
        avgTokens: Math.round(chunks.reduce((sum, c) => sum + c.tokenEstimate, 0) / chunks.length),
      });

      // Step 4: Store chunks in the database
      await prisma.$transaction(async (tx) => {
        // Delete any existing chunks (in case of retry)
        await tx.chunk.deleteMany({
          where: { documentId: docId },
        });

        await tx.chunk.createMany({
          data: chunks.map((chunk) => ({
            documentId: docId,
            index: chunk.index,
            content: chunk.text,
            tokenCount: chunk.tokenEstimate,
          })),
        });

        await job.updateProgress(50);
      });

      // Step 5: Generate embeddings (the expensive step)
      const chunkTexts = chunks.map((c) => c.text);
      const embeddings = await generateEmbeddingsBatchCached(chunkTexts);
      await job.updateProgress(85);

      // Step 6: Store embeddings
      const storedChunks = await prisma.chunk.findMany({
        where: { documentId: docId },
        orderBy: { index: "asc" },
        select: { id: true },
      });

      await storeChunkEmbeddingsBatch(
        storedChunks.map((c, i) => ({
          id: c.id,
          embedding: embeddings[i]!,
        })),
      );
      await job.updateProgress(95);

      // Step 7: Mark complete
      await prisma.document.update({
        where: { id: docId },
        data: {
          status: "ready",
          chunkCount: chunks.length,
        },
      });
      await job.updateProgress(100);

      const duration = Date.now() - startTime;

      // Emit event for audit/notification
      appEvents.emit("doc:processed", {
        docId,
        userId,
        chunkCount: chunks.length,
        correlationId,
      });

      logger.info("Document processing complete", {
        correlationId,
        documentId: docId,
        chunkCount: chunks.length,
        durationMs: duration,
      });

      return {
        success: true,
        chunks: chunks.length,
        durationMs: duration,
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
      logger.error("Document processing failed", {
        correlationId,
        documentId: docId,
        error: (err as Error).message,
        attempt: job.attemptsMade + 1,
      });
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
  // logger.info(`Job ${job.id} completed: ${job.returnvalue?.chunks} chunks`);
  logger.info(`Job completed`, {
    jobId: job.id,
    chunkCount: job.returnvalue?.chunks,
  });
});

worker.on("failed", async (job, error) => {
  if (!job) {
    return;
  }

  if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
    // logger.error(
    //   `Job ${job?.id} failed permanently: ${error.message}. Moving to Dead Letter Queue`,
    // );
    logger.error(`Job failed permanently. Moving to Dead Letter Queue`, {
      jobId: job?.id,
      errorMessage: error.message,
    });
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
  logger.error("Worker error", {
    error,
  });
});

export { worker };
