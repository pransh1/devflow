import api from "./api";
import type { Channel, ChatMessage } from "@/types";


export async function getChannels(workspaceId: string) {
  const res = await api.get<{ data: Channel[] }>(`/workspaces/${workspaceId}/channels`);
  return res.data.data;
};

export async function createChannel(workspaceId: string, data: {
  name: string;
  description?: string
}) {
  const res = await api.post<{ data: Channel }>(`/workspaces/${workspaceId}/channels`, data);
  return res.data.data;
};

export async function getMessages(workspaceId: string, channelId: string) {
  const res = await api.get<{ data: ChatMessage[] }>(`/workspaces/${workspaceId}/channels/${channelId}/messages`);
  return res.data.data;
};

export async function sendMessage(workspaceId: string, channelId: string, content: string) {
  const res = await api.post<{ data: ChatMessage }>(
    `/workspaces/${workspaceId}/channels/${channelId}/messages`,
    { content }
  );
  return res.data.data;
};