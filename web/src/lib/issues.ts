import api from './api';
import type { Issue, IssueStatus, IssuePriority } from '@/types';

interface ListIssuesParams {
  status?: IssueStatus;
  priority?: IssuePriority;
  page?: number;
  limit?: number;
};

export async function listIssues(
  workspaceId: string, 
  projectId: string, 
  params: ListIssuesParams = {}
) {
  const res = await api.get<{ data: { data: Issue[]; pagination: any } }>(
    `/workspaces/${workspaceId}/projects/${projectId}/issues`,
    { params }
  );
  return res.data.data;
};

export async function getIssue(workspaceId: string, issueId: string) {
  const res = await api.get<{ data: Issue }>(`/workspaces/${workspaceId}/issues/${issueId}`);
  return res.data.data;
};

export async function createIssue(
  workspaceId: string,
  projectId: string,
  data: { 
    title: string; 
    description?: string; 
    status?: IssueStatus; 
    priority?: IssuePriority 
  }
) {
  const res = await api.post<{ data: Issue }>(
    `/workspaces/${workspaceId}/projects/${projectId}/issues`,
    data
  );
  return res.data.data;
};

export async function updateIssue(
  workspaceId: string,
  issueId: string,
  data: Partial<{ 
    title: string; 
    description: string; 
    status: IssueStatus; 
    priority: IssuePriority }>
) {
  const res = await api.patch<{ data: Issue }>(`/workspaces/${workspaceId}/issues/${issueId}`, data);
  return res.data.data;
};

export async function deleteIssue(workspaceId: string, issueId: string) {
  await api.delete(`/workspaces/${workspaceId}/issues/${issueId}`);
};

export async function addComment(workspaceId: string, issueId: string, content: string) {
  const res = await api.post(`/workspaces/${workspaceId}/issues/${issueId}/comments`, { content });
  return res.data.data;
};