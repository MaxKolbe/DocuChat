import * as z from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../../utils/responseHandler.js";

// VALIDATION MIDDLEWARE WITH ZOD
export const validateRequest =
   <T>(schema: z.ZodType<T>) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body;
      const result = schema.safeParse(payload);

      if (result.success) {
        next();
      } else {
        errorResponse(res, 400, "Invalid Payload", result.error.issues);
      }
    } catch (error) {
      errorResponse(res, 400, "An Error Occurred", error);
    }
  };

