import express from "express";
import { prisma } from "../../lib/prisma.js";
import redisClient from "../../configs/cache.config.js";

const router = express.Router();

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness- is the process running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: ok
 */
router.get("/live", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness- can the process handle requests
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: ok
 *       503:
 *         description: degraded
 */
router.get("/ready", async (req, res) => {
  const checks: Record<string, any> = {};

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch (error) {
    checks.database = {
      status: "error",
      message: (error as Error).message,
    };
  }

  // Check Redis
  try {
    await redisClient.ping();
    checks.redis = { status: "ok" };
  } catch (error) {
    checks.redis = {
      status: "error",
      message: (error as Error).message,
    };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
