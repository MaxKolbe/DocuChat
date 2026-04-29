import { Pool } from "pg";
import "dotenv/config"
import logger from "./logger.config.js";

const dbMap = new Map([
  ["development", process.env.PG_DATABASE_DEV_URL],
  ["test", process.env.PG_DATABASE_TEST_URL],
  ["production", process.env.PG_DATABASE_PROD_URL],
]);
const dburl = dbMap.get(process.env.NODE_ENV!);

const pool = new Pool({
  connectionString: dburl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
  logger.info("Connected to the database Pool successfully");
});

pool.on("error", () => {
  logger.info("Error Connecting to the database Pool");
});

export default pool;
