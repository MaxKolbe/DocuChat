//(preview — we'll use this in Week 4)
import { Queue } from "bullmq";
import { openaiBreaker } from "../lib/http/openai.breaker.js";
import "dotenv/config";

const redis_host = process.env.REDIS_HOST! as string;
const redis_port = Number(process.env.REDIS_PORT!);
export const embeddingQueue = new Queue("embedding-generation", {
  connection: {
    host: redis_host,
    port: redis_port,
  },
});

// In the worker, configure rate limiting:
import { Worker } from "bullmq";

const worker = new Worker(
  "embedding-generation",
  async (job) => {
    // Call OpenAI through the breaker
    return openaiBreaker.fire("/embeddings", {
      input: job.data.text,
      model: "text-embedding-3-small",
    });
  },
  {
    connection: {
      host: redis_host,
      port: redis_port,
    },
    concurrency: 5,
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // Per 60 seconds
    },
  },
);
