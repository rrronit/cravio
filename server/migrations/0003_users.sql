PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO users (id,email,name,created_at,updated_at)
VALUES ('demo-user','ronit@cravio.app','Ronit',datetime('now'),datetime('now'));

ALTER TABLE recipes ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
UPDATE recipes SET user_id = 'demo-user' WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS recipes_user_idx ON recipes(user_id, imported_at DESC);

ALTER TABLE import_jobs ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
UPDATE import_jobs SET user_id = 'demo-user' WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS import_jobs_user_idx ON import_jobs(user_id, created_at DESC);
