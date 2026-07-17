PRAGMA foreign_keys = ON;

ALTER TABLE pantry_items ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
UPDATE pantry_items SET user_id = 'demo-user' WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS pantry_items_user_idx ON pantry_items(user_id, created_at DESC);
