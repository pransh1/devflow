import { z } from "zod";


export const createChannelSchema = z.object({
  name: z.string()
          .min(2)
          .max(100)
          .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, hyphens'),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false)
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  parentId: z.string().uuid().optional(), // for thread replies
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const getMessagesSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  before: z.string().uuid().optional(), // cursor-based pagination
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;