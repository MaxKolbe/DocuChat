import { Response } from "express";

export const successResponse = (
  res: Response,
  code: number,
  message: string,
  data: any = null,
  meta?: any,
) => {
  return res.status(code).json({
    success: true,
    message,
    data,
    meta,
  });
};

export const errorResponse = (res: Response, code: number, message: string, error?: any) => {
  return res.status(code).json({
    success: false,
    message,
    error,
  });
};

// Error response Example
// {
//   "success": false,
//   "error": {
//     "code": "VALIDATION_ERROR",
//     "message": "Request validation failed",
//     "details": [
//       { "field": "email", "message": "Invalid email format" },
//       { "field": "password", "message": "Must be at least 8 characters" }
//     ]
//   }
// }
