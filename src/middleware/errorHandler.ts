import { Request, Response, NextFunction } from "express";
import logger from "../configs/logger.config.js";
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.info(`There was an Error--> ${err.stack}`);
  return res.status(500).json({
    status: 500,
    message: err.name,
    error: err.message,
  });
};

export default errorHandler;
