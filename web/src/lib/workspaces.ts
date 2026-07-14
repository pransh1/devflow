import api from './api';
import type { Workspace, Project } from '@/types';

export async function getMyWorkspaces() {
  const res = await api.get<{ data: Workspace[] }>('/workspaces');
  return res.data.data;
};

export async function createWorkspace(data: { 
  name: string; 
  slug: string; 
  description?: string 
}) {
  const res = await api.post<{ data: Workspace }>('/workspaces', data);
  return res.data.data;
};

export async function getWorkspaceBySlug(slug: string) {
  const res = await api.get<{ data: Workspace }>(`/workspaces/${slug}`);
  return res.data.data;
};

export async function getProjects(workspaceId: string) {
  const res = await api.get<{ data: Project[] }>(`/workspaces/${workspaceId}/projects`);
  return res.data.data;
};

export async function createProject(workspaceId: string, 
  data: { 
    name: string; 
    slug: string; 
    description?: string 
  }) {
  const res = await api.post<{ data: Project }>(`/workspaces/${workspaceId}/projects`, data);
  return res.data.data;
};