//CONTROLLER
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/responseHandler.js";
import {
  createConversation,
  listConversations,
  sendMessage,
} from "../../services/conversation.services.js";

export const listConversationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit } = req.qtransformed;

  try {
    const response = await listConversations(req.user!.id, { page, limit });
    successResponse(res, 200, response.message, response.data, response.meta);
  } catch (err) {
    next(err);
  }
};

export const createConverationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {title} = req.body
  try {
    const response = await createConversation(req.user!.id, title);
    successResponse(res, response.code, response.message, response.data);
  } catch (err) {
    next(err);
  }
};

export const sendMessageController = async (req: Request, res: Response, next: NextFunction) => {
  const conversationId = req.params.conversationId!.toString();
  const { content, documentId } = req.body;
  try {
    const response = await sendMessage(conversationId, req.user!.id, content, documentId);
    successResponse(res, response.code, response.message, response.data);
  } catch (err) {
    next(err);
  }
};
