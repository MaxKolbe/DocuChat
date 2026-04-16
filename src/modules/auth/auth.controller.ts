import { Request, Response, NextFunction } from "express";
import { register, login, refresh, logout } from "./auth.services.js";
import { successResponse } from "../../utils/responseHandler.js";

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  try {
    const response = await register({ email, password });
    return successResponse(res, response.code, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const deviceInfo = req.headers["user-agent"]!;
  try {
    const response = await login({ email, password, deviceInfo });
    return successResponse(res, response.code, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  try {
    const response = await refresh(refreshToken);
    return successResponse(res, response.code, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  try {
    const response = await logout(refreshToken);
    return successResponse(res, 200, "Logged out");
  } catch (error) {
    next(error);
  }
};
