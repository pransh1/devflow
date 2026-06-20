//  middleware that runs on every workspace route, checks the user is a member, 
// and attaches the workspace + their role to req

import { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { workspaces, workspaceMembers } from '../db/schema';
import { errorResponse } from '../utils/apiResponse';
import type { Workspace, WorkspaceMember } from '../db/schema';

// Extend Request to carry workspace context
declare global {
  namespace Express {
    interface Request {
      workspace?: Workspace,
      workspaceMembership?: WorkspaceMember;
    }
  }
};

export function workspaceAccess(requiredRole?: 'owner' | 'admin') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const  workspaceId  = req.params.workspaceId as string;

      if(!workspaceId) {
        errorResponse(res, 'Workspace ID is required', 400);
        return;
      }

      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.id, workspaceId),
      });
      
      if(!workspace) {
        errorResponse(res, 'Workspace not found', 404);
        return;
      }

      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, req.user!.userId)
        ),
      });
      if (!membership) {
        errorResponse(res, 'You are not a member of this workspace', 403);
        return;
      }

      if(requiredRole === 'admin' && membership.role === 'member') {
        errorResponse(res, 'Admin access required', 403);
        return;
      }

      if(requiredRole === 'owner' && membership.role !== 'owner') {
        errorResponse(res, 'Owner access required', 403);
        return;
      }

      req.workspace = workspace;
      req.workspaceMembership = membership;
      next();

    } catch (error) {
      errorResponse(res, 'Workspace access check failed', 500);
    }
  };
};
