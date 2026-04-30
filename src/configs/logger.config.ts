import winston from "winston";
import "dotenv/config";
import { Logtail } from "@logtail/node";
// import { LogtailTransport } from "@logtail/winston";

// Create a Logtail client
// const logtail = new Logtail(process.env.SOURCE_TOKEN!, {
//   endpoint: `https://${process.env.INGESTING_HOST}`,
// });
const isProduction = process.env.NODE_ENV === "production";
const { combine, timestamp, json, errors, align, cli, printf } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    errors({ stack: true }),
    isProduction
      ? combine(json(), align())
      : combine(
          cli(),
          printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
            return `${timestamp} ${level}: ${message}${metaStr}`;
          }),
        ),
  ),
  defaultMeta: { service: "docuchat" },
  transports: [new winston.transports.Console() /*, new LogtailTransport(logtail)*/],
});

export default logger;
