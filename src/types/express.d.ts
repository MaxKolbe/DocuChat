import { Request } from "express";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string, tier: string };
      qtransformed?: any; // for tranformations made to req.query
      correlationId?: string;
    }
  }
}
