import { createSecureToken, createOtpCode, keyedHash } from '../lib/crypto';
import { createAppError } from '../models/error.model';
import type { AuthResult } from '../models/auth.model';
import type { AuthRepository } from '../repositories/auth.repository';
import type { UserRepository } from '../repositories/user.repository';
import type { EmailService } from './email.service';

const OTP_TTL_SECONDS = 10 * 60;
const OTP_RESEND_SECONDS = 60;
const OTP_WINDOW_SECONDS = 60 * 60;
const OTP_SEND_LIMIT = 5;
const OTP_ATTEMPT_LIMIT = 5;
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export const createAuthService = (
  auth: AuthRepository,
  users: UserRepository,
  mail: EmailService,
  secret: string,
  environment: 'development' | 'production',
) => {
  const requireSecret = () => {
    if (!secret || secret.length < 32) throw createAppError(503, 'Authentication is not configured.');
  };

  const authenticate = async (authorization: string | null) => {
    requireSecret();
    const token = readBearerToken(authorization);
    const tokenHash = await keyedHash(secret, 'session', token);
    const now = Math.floor(Date.now() / 1000);
    const session = await auth.findSession(tokenHash, now);
    if (!session) throw createAppError(401, 'Session is invalid or expired.');
    const user = await users.findById(session.userId);
    if (!user) throw createAppError(401, 'Session user no longer exists.');
    await auth.touchSession(tokenHash, now);
    return { user, tokenHash };
  };

  return {
    requestOtp: async (email: string): Promise<{ devCode?: string }> => {
      requireSecret();
      const now = Math.floor(Date.now() / 1000);
      const current = await auth.findChallenge(email);
      if (current && now - current.lastSentAt < OTP_RESEND_SECONDS) {
        throw createAppError(429, 'Please wait before requesting another code.', {
          retryAfterSeconds: OTP_RESEND_SECONDS - (now - current.lastSentAt),
        });
      }

      const inWindow = current && now - current.windowStartedAt < OTP_WINDOW_SECONDS;
      const sendCount = inWindow ? current.sendCount + 1 : 1;
      if (sendCount > OTP_SEND_LIMIT) {
        throw createAppError(429, 'Too many codes requested. Please try again later.');
      }

      const code = createOtpCode();
      const challenge = {
        id: `otp_${crypto.randomUUID()}`,
        email,
        codeHash: await keyedHash(secret, 'otp', `${email}:${code}`),
        expiresAt: now + OTP_TTL_SECONDS,
        attempts: 0,
        maxAttempts: OTP_ATTEMPT_LIMIT,
        lastSentAt: now,
        sendCount,
        windowStartedAt: inWindow ? current.windowStartedAt : now,
      };
      await auth.saveChallenge(challenge);
      try {
        await mail.sendOtp(email, code);
      } catch {
        await auth.deleteChallenge(challenge.id);
        throw createAppError(503, 'The sign-in email could not be sent.');
      }
      return environment === 'development' ? { devCode: code } : {};
    },

    verifyOtp: async (email: string, code: string): Promise<AuthResult> => {
      requireSecret();
      const now = Math.floor(Date.now() / 1000);
      const challenge = await auth.findChallenge(email);
      if (!challenge || challenge.expiresAt <= now) {
        throw createAppError(401, 'Code is invalid or expired.');
      }
      if (challenge.attempts >= challenge.maxAttempts) {
        throw createAppError(429, 'Too many incorrect attempts. Request a new code.');
      }

      const codeHash = await keyedHash(secret, 'otp', `${email}:${code}`);
      if (!await auth.consumeChallenge(challenge.id, codeHash, now)) {
        await auth.incrementAttempts(challenge.id);
        throw createAppError(401, 'Code is invalid or expired.');
      }

      let user = await users.findByEmail(email);
      if (!user) {
        const isoNow = new Date().toISOString();
        user = {
          id: `usr_${crypto.randomUUID()}`,
          email,
          name: defaultName(email),
          createdAt: isoNow,
          updatedAt: isoNow,
        };
        await users.create(user);
      }

      const token = createSecureToken();
      const expiresAt = now + SESSION_TTL_SECONDS;
      await auth.createSession({
        tokenHash: await keyedHash(secret, 'session', token),
        userId: user.id,
        expiresAt,
        createdAt: now,
        lastUsedAt: now,
      });
      return { token, expiresAt: new Date(expiresAt * 1000).toISOString(), user };
    },

    me: async (authorization: string | null) => (await authenticate(authorization)).user,

    logout: async (authorization: string | null): Promise<void> => {
      const { tokenHash } = await authenticate(authorization);
      await auth.deleteSession(tokenHash);
    },
  };
};

export type AuthService = ReturnType<typeof createAuthService>;

const readBearerToken = (authorization: string | null): string => {
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) throw createAppError(401, 'A bearer token is required.');
  return match[1]!;
};

const defaultName = (email: string): string => {
  const localPart = email.split('@')[0]!.replace(/[._-]+/g, ' ').trim();
  return localPart ? localPart.replace(/\b\w/g, (character) => character.toUpperCase()) : 'Cravio User';
};
