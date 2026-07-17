import api from './api';
import type { User } from '@/types';

export interface Member {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: User;
}

export async function getMembers(workspaceId: string) {
  const res = await api.get<{ data: Member[] }>(`/workspaces/${workspaceId}/members`);
  return res.data.data;
}

export async function inviteMember(workspaceId: string, email: string, role: 'admin' | 'member' = 'member') {
  const res = await api.post(`/workspaces/${workspaceId}/members`, { email, role });
  return res.data.data;
}

export async function removeMember(workspaceId: string, userId: string) {
  await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
}