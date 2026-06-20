import { Request, Response, NextFunction } from 'express';
import {
  createProjectSchema,
  createIssueSchema,
  updateIssueSchema,
  createCommentSchema,
  listIssuesSchema,
} from './issues.schema';
import * as issuesService from './issues.service';
import { successResponse } from '../../utils/apiResponse';

// ─── Projects ────────────────────────────────────────────────
export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const input = createProjectSchema.parse(req.body);
    const project = await issuesService.createProject(input, workspaceId, req.user!.userId);
    successResponse(res, project, 'Project created', 201);
  } catch (error) {
    next(error);
  };
};

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projects = await issuesService.getProjects(workspaceId);
    successResponse(res, projects)
  } catch (error) {
    next(error);
  };
};

export async function getProjectBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const slug = req.params.slug as string;
    const project = await issuesService.getProjectBySlug(workspaceId, slug);
    successResponse(res, project);
  } catch (error) { 
    next(error); 
  };
};


// ─── Issues ──────────────────────────────────────────────────
export async function createIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;
    const input = createIssueSchema.parse(req.body);
    const issue = await issuesService.createIssue(input, projectId, workspaceId, req.user!.userId);
    successResponse(res, issue, 'Issue created', 201);
  } catch (error) {
    next(error);
  };
};

export async function listIssues(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;
    const filter = listIssuesSchema.parse(req.query ?? {});
    const result = await issuesService.listIssues(workspaceId, projectId, filter);
    successResponse(res, result);
  } catch (error) {
    next(error);
  };
};

export async function getIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const issueId = req.params.issueId as string;
    const issue = await issuesService.getIssueById(issueId, workspaceId);
    successResponse(res, issue);
  } catch (error) {
    next(error);
  };
};

export async function updateIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const issueId = req.params.issueId as string;
    const input = updateIssueSchema.parse(req.body);
    const issue = await issuesService.updateIssue(issueId, workspaceId, input);
    successResponse(res, issue, 'Issue updated');
  } catch (error) {
    next(error);
  };
};

export async function deleteIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const issueId = req.params.issueId as string;
    const result = await issuesService.deleteIssue(issueId, workspaceId);
    successResponse(res, result, 'Issue deleted');
  } catch (error) { 
    next(error); 
  };
};

// ─── Comments ────────────────────────────────────────────────
export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const issueId = req.params.issueId as string;
    const { content } = createCommentSchema.parse(req.body);
    const comment = await issuesService.addComment(issueId, workspaceId, content, req.user!.userId);
    successResponse(res, comment, 'Comment added', 201);
  } catch (error) {
    next(error);
  };
};

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const commentId = req.params.commentId as string;
    const result = await issuesService.deleteComment(commentId, req.user!.userId, workspaceId);
    successResponse(res, result, 'Comment deleted');
  } catch (error) {
    next(error);
  };
};