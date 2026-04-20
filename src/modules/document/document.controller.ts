//CONTROLLER
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/responseHandler.js";
import { getDocument, createService, updateService, deleteService } from "./document.services.js";

export const getController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getDocument(req.params.id!.toString(), req.user!.id.toString());
    successResponse(res, response.code, response.message, response.data);
  } catch (err) {
    next(err);
  }
};

export const postController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const response = await createService();
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
