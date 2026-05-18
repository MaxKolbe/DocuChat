import express from "express";
import helmet from "helmet";
import cors from "cors";
import authRouter from "./modules/auth/auth.routes.js";
import adminRouter from "./modules/admin/admin.routes.js";
import healthRouter from "./modules/health/health.routes.js";
import documentRouter from "./modules/document/document.routes.js";
import conversationRouter from "./modules/conversation/conversation.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./configs/logger.config.js";
import swaggerUi from "swagger-ui-express";
import { prisma } from "./lib/prisma.js";
import { authenticate } from "./middleware/auth.js";
import { connectRedis } from "./configs/cache.config.js";
import { swaggerSpec } from "./configs/swagger.config.js";
import { bullBoardAdapter } from "./configs/bull-board.config.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.js";
import { sanitizeInput } from "./middleware/sanitize.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { metricsMiddleware } from "./middleware/metricsMiddleware.js";
import { metricsRegistry } from "./lib/metrics.js";
import { verifyWebhookSignature } from "./middleware/verifyWebhook.js";
import { Request, Response } from "express";
import "./events/auth.events.js";
import "./events/admin.events.js";
import "./events/document.events.js";
import "./events/cache.events.js";
import "./events/embedding.events.js";
import "./events/ingestion.events.js";
import "./queues/document.worker.js";
import "dotenv/config";

const app = express();

const whitelist = [`http://localhost:${process.env.PORT}`];
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allowed?: boolean) => void,
  ) {
    if (whitelist.indexOf(origin || "") !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  credentials: true, //Allow cookies/auth headers
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // Cache preflight requests for 24 hours
};

// Capture raw body for webhook routes BEFORE express.json()

const secret = process.env.WEBHOOK_SECRET;

app.use(
  "/webhooks",
  verifyWebhookSignature(secret!, "x-signature"),
  express.raw({
    type: "application/json",
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(sanitizeInput);
app.use(metricsMiddleware);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'none'"],
        connectSrc: ["'self'"],
      },
    },
  }),
);
app.use(cors(corsOptions));

await (async () => {
  await connectRedis();
})();

//ROUTES
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/documents", authenticate, apiLimiter, documentRouter);
app.use("/api/v1/conversations", authenticate, apiLimiter, conversationRouter);
app.use("/api/v1/admin", authenticate, apiLimiter, adminRouter);
app.use("/api/v1/health", healthRouter);
// SERVE SWAGGER UI
app.use(
  "/api-docs",
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec),
);
// SERVE THE RAW JSON SPEC (useful for code generators)
app.get("/api-docs.json", (req: Request, res: Response) => {
  res.json(swaggerSpec);
});
// MOUNT THE BULL BOARD DASHBOARD (PROTECT WITH AUTH IN PRODUCTION)
app.use(
  "/admin/queues",
  authenticate,
  /*requirePermission("roles:manage"),*/ bullBoardAdapter.getRouter(),
);
// Metrics endpoint (no auth — Prometheus needs to scrape it)
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// 404 HANDLER FOR UNKNOWN ROUTES
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.path} not found` },
  });
});

//GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;
