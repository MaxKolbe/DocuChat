//CONTROLLER
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/responseHandler.js";
import { listConversations, sendMessage } from "../../services/conversation.services.js";

export const listConversationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.params.userId!.toString();
  const page = Number(req.query.page);
  const limit = Number(req.query.page);

  try {
    const response = await listConversations(userId, { page, limit });
    successResponse(res, 200, response.message, response.data, response.meta);
  } catch (err) {
    next(err);
  }
};

export const sendMessageController = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId!.toString();
  const conversationId = req.params.conversationId!.toString();
  const documentId = req.params.documentId!.toString();
  const {content} = req.body
  try {
    const response = await sendMessage(conversationId, userId, content, documentId);
    successResponse(res, 200, "Message sent successfully", response.data);
  } catch (err) {
    next(err);
  }
};
