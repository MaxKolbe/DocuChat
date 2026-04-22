//CONTROLLER
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/responseHandler.js";
import {
  getDocument,
  listDocuments,
  createDocument,
  deleteDocument,
  pollDocument,
} from "../../services/document.services.js";

export const listDocumentsController = async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, status, search, sortBy, sortOrder } = req.qtransformed;
  const userId = req.user!.id;
  try {
    const response = await listDocuments(userId, {
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
    });
    successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (err) {
    next(err);
  }
};

export const getDocumentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getDocument(req.params.docId!.toString(), req.user!.id);
    successResponse(res, response.code, response.message, response.data);
  } catch (err) {
    next(err);
  }
};

export const createDocumentController = async (req: Request, res: Response, next: NextFunction) => {
  const { title, content } = req.body;
  try {
    const response = await createDocument(req.user!.id, {
      title,
      content,
    });
    successResponse(res, response.code, response.message, response.data);
  } catch (err) {
    next(err);
  }
};

export const deleteDocumentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteDocument(req.params.docId!.toString(), req.user!.id);
    successResponse(res, 200, "Deleted successfully");
  } catch (err) {
    next(err);
  }
};

export const pollDocumentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await pollDocument(req.params.id!.toString(), req.user!.id);
    return successResponse(res, response.code, response.message, response.data)
  } catch (err) {
    next(err);
  }
};
