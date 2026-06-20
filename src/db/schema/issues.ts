import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { workspaces } from './workspaces';
import { users } from './users';

export const issueStatusEnum = pgEnum('issue_status', [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
  'cancelled',
]);

export const issuePriorityEnum = pgEnum('issue_priority', [
  'no_priority',
  'urgent',
  'high',
  'medium',
  'low',
]);

export const issues = pgTable('issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: issueStatusEnum('status').default('backlog').notNull(),
  priority: issuePriorityEnum('priority').default('no_priority').notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  createdById: uuid('created_by_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  orderIndex: integer('order_index').default(0).notNull(), // for drag-and-drop ordering later
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const issueComments = pgTable('issue_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  issueId: uuid('issue_id').notNull().references(() => issues.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type IssueComment = typeof issueComments.$inferSelect;