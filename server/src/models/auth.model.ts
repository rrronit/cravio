import { z } from 'zod';
import type { User } from './user.model';

export const requestOtpSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export const verifyOtpSchema = requestOtpSchema.extend({
  code: z.string().trim().regex(/^\d{6}$/, 'Code must contain exactly 6 digits.'),
});

export type OtpChallenge = {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  lastSentAt: number;
  sendCount: number;
  windowStartedAt: number;
};

export type OtpChallengeRow = {
  id: string;
  email: string;
  code_hash: string;
  expires_at: number;
  attempts: number;
  max_attempts: number;
  last_sent_at: number;
  send_count: number;
  window_started_at: number;
};

export type AuthSession = {
  tokenHash: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
  lastUsedAt: number;
};

export type AuthSessionRow = {
  token_hash: string;
  user_id: string;
  expires_at: number;
  created_at: number;
  last_used_at: number;
};

export type AuthResult = {
  token: string;
  expiresAt: string;
  user: User;
};
