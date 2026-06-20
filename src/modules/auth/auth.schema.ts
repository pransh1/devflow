// Zod schemas to validate request bodies:

import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
            .string()
            .min(3, 'username must be atleast 3 characters')
            .max(50, 'username too long')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, underscores'),
  password: z
            .string()
            .min(8, 'Password must be atleast 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Full name too short').optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

