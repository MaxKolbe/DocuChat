import "dotenv/config";
import { Queue } from "bullmq";

const redis_host = process.env.REDIS_HOST! as string;
const redis_port = Number(process.env.REDIS_PORT!);

export const deadLetterQueue = new Queue("dead-letter", {
  connection: {
    host: redis_host,
    port: redis_port,
  },
});
