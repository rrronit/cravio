PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_otp_challenges (
  id TEXT NOT NULL,
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  last_sent_at INTEGER NOT NULL,
  send_count INTEGER NOT NULL DEFAULT 1 CHECK (send_count > 0),
  window_started_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_otp_expiry_idx ON auth_otp_challenges(expires_at);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);
