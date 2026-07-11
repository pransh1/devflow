import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as aiService from '../../services/ai.service';
import { successResponse, errorResponse } from '../../utils/apiResponse';

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1),
  })).min(1),
  context_type: z.enum(['general', 'issue', 'document']).default('general'),
  context_id: z.string().uuid().optional(),
});

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  resource_types: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(20).default(10),
});

export async function chat(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const input = chatSchema.parse(req.body);

    const result = await aiService.chatWithAI({
      messages: input.messages,
      workspace_id: workspaceId,
      context_type: input.context_type,
      context_id: input.context_id,
    });

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export async function semanticSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const input = searchSchema.parse(req.body);

    const results = await aiService.searchSimilar({
      query: input.query,
      workspace_id: workspaceId,
      resource_types: input.resource_types,
      limit: input.limit,
    });

    successResponse(res, results);
  } catch (error) {
    next(error);
  }
};

export async function summarizeIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const issueId = req.params.issueId as string;

    const summary = await aiService.summarizeIssue({
      resource_type: 'issue',
      resource_id: issueId,
      workspace_id: workspaceId,
    });

    successResponse(res, { summary, issueId });
  } catch (error) {
    next(error);
  }
};