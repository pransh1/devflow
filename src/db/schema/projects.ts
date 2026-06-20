import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';
import { users } from './users';

export const projectStatusEnum = pgEnum('project_status', ['active', 'archived', 'paused']);

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('active').notNull(),
  createdById: uuid('created_by_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;