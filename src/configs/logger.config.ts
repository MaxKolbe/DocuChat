import winston from "winston";
import dotenv from "dotenv";
import { Logtail } from "@logtail/node";
// import { LogtailTransport } from "@logtail/winston";

dotenv.config({
  path: "../../.env",
});

// Create a Logtail client
// const logtail = new Logtail(process.env.SOURCE_TOKEN!, {
//   endpoint: `https://${process.env.INGESTING_HOST}`,
// });
const { combine, timestamp, json, errors, align, cli } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    json(),
    errors({ stack: true }),
    align(),
    cli(),
  ),
  transports: [new winston.transports.Console()/*, new LogtailTransport(logtail)*/],
});

export default logger;
