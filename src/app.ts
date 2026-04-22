import express from "express";
import cors from "cors";
import errorHandler from "./middleware/errorHandler.js";
import authRouter from "./modules/auth/auth.routes.js";
import documentRouter from "./modules/document/document.routes.js";
import conversationRouter from "./modules/conversation/conversation.routes.js";
import adminRouter from "./modules/admin/admin.routes.js";
import logger from "./configs/logger.config.js";
import swaggerUi from "swagger-ui-express";
import { authenticate } from "./middleware/auth.js";
// import { connectRedis } from "./configs/cache.config.js";
import { swaggerSpec } from "./configs/swagger.config.js";
import { prisma } from "./lib/prisma.js";
import { Request, Response } from "express";
import "./events/auth.events.js";
import "./events/admin.events.js";
import "./events/document.events.js";
import "./queues/document.worker.js"
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
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, //Allow cookies/auth
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// connectRedis();

//ROUTES
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/documents", authenticate, documentRouter);
app.use("/api/v1/conversations", authenticate, conversationRouter);
app.use("/api/v1/admin", adminRouter);
// SERVE SWAGGER UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// SERVE THE RAW JSON SPEC (useful for code generators)
app.get("/api-docs.json", (req: Request, res: Response) => {
  res.json(swaggerSpec);
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
