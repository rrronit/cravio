import type { AuthSession, AuthSessionRow, OtpChallenge, OtpChallengeRow } from '../models/auth.model';

export const createAuthRepository = (db: D1Database) => ({
  findChallenge: async (email: string): Promise<OtpChallenge | null> => {
    const row = await db.prepare('SELECT * FROM auth_otp_challenges WHERE email = ?')
      .bind(email).first<OtpChallengeRow>();
    return row ? mapChallenge(row) : null;
  },

  saveChallenge: async (challenge: OtpChallenge): Promise<void> => {
    await db.prepare(`
      INSERT INTO auth_otp_challenges
        (id,email,code_hash,expires_at,attempts,max_attempts,last_sent_at,send_count,window_started_at)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(email) DO UPDATE SET
        id=excluded.id, code_hash=excluded.code_hash, expires_at=excluded.expires_at,
        attempts=excluded.attempts, max_attempts=excluded.max_attempts,
        last_sent_at=excluded.last_sent_at, send_count=excluded.send_count,
        window_started_at=excluded.window_started_at
    `).bind(
      challenge.id, challenge.email, challenge.codeHash, challenge.expiresAt,
      challenge.attempts, challenge.maxAttempts, challenge.lastSentAt,
      challenge.sendCount, challenge.windowStartedAt,
    ).run();
  },

  deleteChallenge: async (id: string): Promise<void> => {
    await db.prepare('DELETE FROM auth_otp_challenges WHERE id = ?').bind(id).run();
  },

  incrementAttempts: async (id: string): Promise<void> => {
    await db.prepare('UPDATE auth_otp_challenges SET attempts = attempts + 1 WHERE id = ?').bind(id).run();
  },

  consumeChallenge: async (id: string, codeHash: string, now: number): Promise<boolean> => {
    const result = await db.prepare(
      'DELETE FROM auth_otp_challenges WHERE id = ? AND code_hash = ? AND expires_at > ? AND attempts < max_attempts',
    ).bind(id, codeHash, now).run();
    return Boolean(result.meta.changes);
  },

  createSession: async (session: AuthSession): Promise<void> => {
    await db.prepare(`
      INSERT INTO auth_sessions (token_hash,user_id,expires_at,created_at,last_used_at)
      VALUES (?,?,?,?,?)
    `).bind(session.tokenHash, session.userId, session.expiresAt, session.createdAt, session.lastUsedAt).run();
  },

  findSession: async (tokenHash: string, now: number): Promise<AuthSession | null> => {
    const row = await db.prepare(
      'SELECT * FROM auth_sessions WHERE token_hash = ? AND expires_at > ?',
    ).bind(tokenHash, now).first<AuthSessionRow>();
    return row ? mapSession(row) : null;
  },

  touchSession: async (tokenHash: string, now: number): Promise<void> => {
    await db.prepare('UPDATE auth_sessions SET last_used_at = ? WHERE token_hash = ?')
      .bind(now, tokenHash).run();
  },

  deleteSession: async (tokenHash: string): Promise<void> => {
    await db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(tokenHash).run();
  },
});

export type AuthRepository = ReturnType<typeof createAuthRepository>;

const mapChallenge = (row: OtpChallengeRow): OtpChallenge => ({
  id: row.id,
  email: row.email,
  codeHash: row.code_hash,
  expiresAt: row.expires_at,
  attempts: row.attempts,
  maxAttempts: row.max_attempts,
  lastSentAt: row.last_sent_at,
  sendCount: row.send_count,
  windowStartedAt: row.window_started_at,
});

const mapSession = (row: AuthSessionRow): AuthSession => ({
  tokenHash: row.token_hash,
  userId: row.user_id,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
  lastUsedAt: row.last_used_at,
});
