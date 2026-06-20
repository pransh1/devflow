import { pgTable, varchar, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member']);

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', {length: 100}).notNull(),
  slug: varchar('slug', {length: 100}).notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  ownerId: uuid('owner_id').notNull().references(() => users.id, {onDelete: 'restrict'}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(), 
});

export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;