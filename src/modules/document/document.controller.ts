//CONTROLLER
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/responseHandler.js";
import {
  getDocument,
  listDocuments,
  deleteDocument
} from "../../services/document.services.js";
import { Listdocuments } from "./document.schema.js";

export const getDocumentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getDocument(req.params.id!.toString(), req.user!.id.toString());
    successResponse(res, response.code, response.message, response.data);
  } catch (err) {
    next(err);
  }
};

export const listDocumentsController = async (req: Request, res: Response, next: NextFunction) => {
  const {page, limit, status, search, sortBy, sortOrder} = req.query
  try {
    const response = await listDocuments(req.params.id!.toString(), {page, limit, status, search, sortBy, sortOrder})
    successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (err) {
    next(err);
  }
};

export const deleteDocumentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await deleteDocument(req.params.documentId!.toString(), req.params.userId!.toString());
    successResponse(res, 200, "Deleted successfully");
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
    // const response = await updateService();
    successResponse(res, 200, "PUT");
  } catch (err) {
    next(err);
  }
};

export const deleteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const response = await deleteService();
    successResponse(res, 200, "DELETE");
  } catch (err) {
    next(err);
  }
};
