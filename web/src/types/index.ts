export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
};

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  ownerId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
};

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  status: 'active' | 'archieved' | 'paused';
  createdAt: string;
};

export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type IssuePriority = 'no_priority' | 'urgent' | 'high' | 'medium' | 'low';

export interface Issue {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId?: string;
  assignee?: User;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
};

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
};

export interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  author?: User;
  createdAt: string;
};