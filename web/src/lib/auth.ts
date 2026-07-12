import api from "./api";
import type { User } from "@/types";

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}) {
  const res = await api.post<{ data: AuthResponse }>('/auth/register', data);
  return res.data.data;
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  const res = await api.post<{ data: AuthResponse }>('/auth/login', data);
  return res.data.data;
};

export async function getMe() {
  const res = await api.get<{ data: User }>('/auth/me');
  return res.data.data;
};

export function saveAuthData(data: AuthResponse) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
};