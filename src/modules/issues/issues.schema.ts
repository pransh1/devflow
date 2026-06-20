import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, hyphens'),
  description: z.string().max(500).optional()
});

export const createIssueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']).optional(),
  priority: z.enum(['no_priority', 'urgent', 'high', 'medium', 'low']).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateIssueSchema = createIssueSchema.partial(); // all fields optional on update

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000),
});

// Query params for listing issues
export const listIssuesSchema = z.object({
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']).optional(),
  priority: z.enum(['no_priority', 'urgent', 'high', 'medium', 'low']).optional(),
  assigneeId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type ListIssuesInput = z.infer<typeof listIssuesSchema>;