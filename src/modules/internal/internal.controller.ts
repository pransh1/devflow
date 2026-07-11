import { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { issues, issueComments, workspaces, workspaceMembers, users } from '../../db/schema';
import { successResponse, errorResponse } from '../../utils/apiResponse';

export async function getIssueForAI(req: Request, res: Response, next: NextFunction) {
  try {
    const issueId = req.params.issueId as string;

    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
      with: {
        assignee: {
          columns: { id: true, username: true, fullName: true },
        },
        createdBy: {
          columns: { id: true, username: true, fullName: true },
        },
        comments: {
          with: {
            author: {
              columns: { id: true, username: true, fullName: true },
            },
          },
        },
      },
    });

    if(!issue) {
      errorResponse(res, 'Issue not found', 404);
      return;
    }

    successResponse(res, issue);
  } catch (error) {
    next(error);
  };
};

export async function getWorkspaceContext(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId)
    });

    if(!workspace) {
      errorResponse(res, 'Workspace not found', 404);
      return;
    }

    const members = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
      with: {
        user: {
          columns: { id: true, username: true, fullName: true, email: true },
        },
      },
    });

    successResponse(res, { workspace, members });
  } catch (error) {
    next(error)
  }
};
