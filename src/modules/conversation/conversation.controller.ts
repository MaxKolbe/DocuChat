//CONTROLLER
import { Request, Response, NextFunction } from "express"
import { successResponse, errorResponse } from "../../utils/responseHandler.js";
import { getService, createService, updateService, deleteService } from "./feature.services.js";

export const getController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getService();
    successResponse(res, 200, "GET");
  } catch (err) {
    next(err);
  }
};

export const postController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await createService();
    successResponse(res, 200, "POST");
  } catch (err) {
    next(err);
  }
};

export const putController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await updateService();
    successResponse(res, 200, "PUT");
  } catch (err) {
    next(err);
  }
};

export const deleteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await deleteService();
    successResponse(res, 200, "DELETE");
  } catch (err) {
    next(err);
  }
};
