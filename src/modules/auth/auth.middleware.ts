// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../lib/token.js";
import { ForbiddenError, UnauthorizedError } from "../../lib/errors.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer")) {
    throw new UnauthorizedError("No token provided");
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyAccessToken(token!);

    // Make sure it's an access token, not a refresh token
    if (payload.type !== "access") {
      throw new UnauthorizedError("Invalid token type");
    }

    // Attach user context to the request
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token expired");
    }
    throw new UnauthorizedError("Invalid token");
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError("Not authenticated");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    next();
  };
};
