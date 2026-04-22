//CONTROLLER
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/responseHandler.js";
import {
  getDocument,
  listDocuments,
  createDocument,
  deleteDocument,
} from "../../services/document.services.js";
import { Listdocuments } from "./document.schema.js";

export const listDocumentsController = async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, status, search, sortBy, sortOrder } = req.qtransformed;
  try {
    const response = await listDocuments(req.params.userId!.toString(), {
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
    const response = await getDocument(req.params.docId!.toString(), req.params.userId!.toString());
    successResponse(res, response.code, response.message, response.data);
  } catch (err) {
    next(err);
  }
};

export const createDocumentController = async (req: Request, res: Response, next: NextFunction) => {
  const { title, content } = req.body;
  try {
    const response = await createDocument(req.params.userId!.toString(), {
      title,
      content
    });
    successResponse(res, response.code, response.message, response.data);
  } catch (err) {
    next(err);
  }
};

export const deleteDocumentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await deleteDocument(
      req.params.docId!.toString(),
      req.params.userId!.toString(),
    );
    successResponse(res, 200, "Deleted successfully");
  } catch (err) {
    next(err);
  }
};
