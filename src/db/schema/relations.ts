import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces, workspaceMembers } from './workspaces';
import { projects } from './projects';
import { issues, issueComments } from './issues';

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
  createdProjects: many(projects),
  assignedIssues: many(issues, { relationName: 'assignee' }),
  createdIssues: many(issues, { relationName: 'creator' }),
  comments: many(issueComments),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  projects: many(projects),
  issues: many(issues),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
  }),
  issues: many(issues),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [issues.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [issues.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [issues.assigneeId],
    references: [users.id],
    relationName: 'assignee',
  }),
  createdBy: one(users, {
    fields: [issues.createdById],
    references: [users.id],
    relationName: 'creator',
  }),
  comments: many(issueComments),
}));

export const issueCommentsRelations = relations(issueComments, ({ one }) => ({
  issue: one(issues, {
    fields: [issueComments.issueId],
    references: [issues.id],
  }),
  author: one(users, {
    fields: [issueComments.authorId],
    references: [users.id],
  }),
}));