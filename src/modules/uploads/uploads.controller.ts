import { Request, Response, NextFunction } from 'express';
import * as uploadsService from './uploads.service';
import * as authService from '../auth/auth.service';
import { successResponse, errorResponse } from '../../utils/apiResponse';

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if(!req.file) {
      errorResponse(res, 'No file uploaded', 400);
      return;
    };
    const avatarUrl = (req.file as any).path;
    const user = await authService.updateAvatar(req.user!.userId, avatarUrl);
    successResponse(res, user, 'Avatar updated');
  } catch (error) {
    next(error);
  }
};


export async function uploadAttachments(req: Request, res: Response, next: NextFunction) {
  try { 
    if(!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      errorResponse(res, 'No files uploaded', 400);
      return;
    }
    const workspaceId = req.params.workspaceId as string;
    const issueId = req.params.issueId as string;

    const saved = await uploadsService.saveAttachments(
      req.files,
      issueId,
      workspaceId,
      req.user!.userId
    );
    successResponse(res, saved, `${saved.length} file(s) uploaded`, 201);

  } catch (error) {
    next(error);
  }
};

export async function getAttachments(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const issueId = req.params.issueId as string;
    const result = await uploadsService.getIssueAttachments(issueId, workspaceId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function deleteAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const attachmentId = req.params.attachmentId as string;
    const result = await uploadsService.deleteAttachment(
      attachmentId,
      req.user!.userId,
      workspaceId
    );
    successResponse(res, result, 'Attachment deleted');
  } catch (error) {
    next(error);
  }
}