import express from "express";
import cors from "cors";
import errorHandler from "./middleware/errorHandler.js";
import authRouter from "./modules/auth/auth.routes.js";
import documentRouter from "./modules/document/document.routes.js";
import conversationRouter from "./modules/conversation/conversation.routes.js";
import logger from "./configs/logger.config.js";
// import { connectRedis } from "./configs/cache.config.js";
import { prisma } from "./configs/prisma.js";
import "./events/auth.events.js";
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
app.use("/api/auth", authRouter);
app.use("/api/documents", documentRouter);
app.use("/api/conversations", conversationRouter);

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

//GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;
