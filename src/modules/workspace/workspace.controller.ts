import { Request, Response, NextFunction } from 'express';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from './workspace.schema';
import * as workspaceService from './workspace.service';
import { successResponse } from '../../utils/apiResponse';

export async function createWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createWorkspaceSchema.parse(req.body);
    const workspace = await workspaceService.createWorkspace(input, req.user!.userId);
    successResponse(res, workspace, 'Workspace created', 201);
  } catch (error) {
    next(error);
  };
};

export async function getMyWorkspaces(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaces = await workspaceService.getMyWorkspaces(req.user!.userId);
    successResponse(res, workspaces);
  } catch (error) {
    next(error);
  };
};

export async function getWorkspaceBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const workspace = await workspaceService.getWorkspaceBySlug(req.params.slug as string, req.user!.userId);
    successResponse(res, workspace);
  } catch (error) {
    next(error);
  }
}

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const input = inviteMemberSchema.parse(req.body);
    const member = await workspaceService.inviteMember(
      req.params.workspaceId as string , 
      input,
      req.user!.userId
    )
    successResponse(res, member, 'Member invited!', 201);
  } catch (error) {
    next(error);
  };
};

export async function getMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await workspaceService.getWorkspaceMembers(
      req.params.workspaceId as string, 
      req.user!.userId
    )
    successResponse(res, members);
  } catch (error) {
    next(error);
  };
};

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workspaceService.removeMember(
      req.params.workspaceId as string, 
      req.params.userId as string ,// target user
      req.user!.userId
    )
    successResponse(res, result, 'Member removed');
  } catch (error) {
    next(error);
  };
};