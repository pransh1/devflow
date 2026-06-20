import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
        .string()
        .min(2, 'Slug must be at least 2 characters')
        .max(100)
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, hyphens'),
  description: z.string().max(500).optional()
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'member']).default('member')
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;