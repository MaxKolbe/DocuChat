import "dotenv/config";
import { Queue } from "bullmq";

const redis_host = process.env.REDIS_HOST! as string;
const redis_port = Number(process.env.REDIS_PORT!);

export const documentQueue = new Queue("document-processing", {
  connection: {
    host: redis_host,
    port: redis_port,
  },
  // The defaultJobOptions apply to every job added to this queue.
  // To add options to specific jobs, add them as the third argument to the queue.add() function
  // Where the first argument is the name: string, second is data: object, and third options: object
  defaultJobOptions: {
    attempts: 3, // attempt 3 retries on failure
    backoff: {
      type: "exponential",
      delay: 2000, // 2 secs in-between retries
    },
    removeOnComplete: { count: 200 }, // keep up to 200 jobs then cleanup older jobs automatically
    removeOnFail: { count: 500 }, // keep up to 500 jobs then cleanup older jobs automatically
  },
});

export const queueDocumentForProcessing = async (docId: string, userId: string) => {
  const job = await documentQueue.add("process-document", {
    docId,
    userId,
    queuedAt: new Date(Date.now()),
  });

  return job.id;
};
