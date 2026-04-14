// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../utils/token.js";
import { errorResponse } from "../../utils/responseHandler.js";

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

  if (!header || !header.startsWith("Bearer ")) {
    return errorResponse(res, 401, "No token provided");
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyAccessToken(token!);

    // Make sure it's an access token, not a refresh token
    if (payload.type !== "access") {
      return errorResponse(res, 401, "Invalid token type");
    }

    // Attach user context to the request
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, 401, "Token expired");
    }
    return errorResponse(res, 401, "Invalid token");
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 401, "Not authenticated");
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, "Insufficient permissions");
    }
    next();
  };
};
