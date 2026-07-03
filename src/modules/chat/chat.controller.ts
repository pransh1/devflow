import { Request, Response, NextFunction } from 'express';
import {
  createChannelSchema,
  sendMessageSchema,
  editMessageSchema,
  getMessagesSchema,
} from './chat.schema';
import * as chatService from './chat.service';
import { successResponse } from '../../utils/apiResponse';

// ─── Channels ────────────────────────────────────────────────

export async function createChannel(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const input = createChannelSchema.parse(req.body);
    const channel = await chatService.createChannel(input, workspaceId, req.user!.userId);
    successResponse(res, channel, 'Channel created', 201);
  } catch (error) { next(error); }
}

export async function getChannels(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const channels = await chatService.getChannels(workspaceId, req.user!.userId);
    successResponse(res, channels);
  } catch (error) { next(error); }
}

export async function getChannelById(req: Request, res: Response, next: NextFunction) {
  try {
    const channelId = req.params.channelId as string;
    const channel = await chatService.getChannelById(channelId, req.user!.userId);
    successResponse(res, channel);
  } catch (error) { next(error); }
}

export async function joinChannel(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const channelId = req.params.channelId as string;
    const result = await chatService.joinChannel(channelId, workspaceId, req.user!.userId);
    successResponse(res, result);
  } catch (error) { next(error); }
}

export async function deleteChannel(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const channelId = req.params.channelId as string;
    const result = await chatService.deleteChannel(channelId, workspaceId, req.user!.userId);
    successResponse(res, result);
  } catch (error) { next(error); }
}

// ─── Messages ────────────────────────────────────────────────

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const channelId = req.params.channelId as string;
    const input = sendMessageSchema.parse(req.body);
    const message = await chatService.sendMessage(
      input, channelId, workspaceId, req.user!.userId
    );
    successResponse(res, message, 'Message sent', 201);
  } catch (error) { next(error); }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const channelId = req.params.channelId as string;
    const filters = getMessagesSchema.parse(req.query ?? {});
    const messages = await chatService.getMessages(
      channelId, workspaceId, req.user!.userId, filters
    );
    successResponse(res, messages);
  } catch (error) { next(error); }
}

export async function editMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const channelId = req.params.channelId as string;
    const messageId = req.params.messageId as string;
    const { content } = editMessageSchema.parse(req.body);
    const message = await chatService.editMessage(
      messageId, channelId, workspaceId, req.user!.userId, content
    );
    successResponse(res, message, 'Message updated');
  } catch (error) { next(error); }
}

export async function deleteMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const channelId = req.params.channelId as string;
    const messageId = req.params.messageId as string;
    const result = await chatService.deleteMessage(
      messageId, channelId, workspaceId, req.user!.userId
    );
    successResponse(res, result);
  } catch (error) { next(error); }
}

export async function getThreadReplies(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const channelId = req.params.channelId as string;
    const messageId = req.params.messageId as string;
    const replies = await chatService.getThreadReplies(
      messageId, channelId, workspaceId, req.user!.userId
    );
    successResponse(res, replies);
  } catch (error) { next(error); }
}