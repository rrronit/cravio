import { z } from 'zod';

export const userCreateSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  name: z.string().trim().min(1),
  avatarUrl: z.string().url().optional(),
});

export type UserCreate = z.infer<typeof userCreateSchema>;
export type User = { id: string; email: string; name: string; avatarUrl?: string; createdAt: string; updatedAt: string };
export type UserRow = { id: string; email: string; name: string; avatar_url: string | null; created_at: string; updated_at: string };
