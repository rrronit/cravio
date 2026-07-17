PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dark_mode INTEGER NOT NULL DEFAULT 0 CHECK (dark_mode IN (0, 1)),
  notifications_enabled INTEGER NOT NULL DEFAULT 1 CHECK (notifications_enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO user_preferences (user_id,dark_mode,notifications_enabled,created_at,updated_at)
VALUES ('demo-user',0,1,datetime('now'),datetime('now'));

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, is_read, created_at DESC);

INSERT OR IGNORE INTO notifications (id,user_id,icon,title,body,is_read,created_at) VALUES
('not_demo_recipe_ready','demo-user','check-circle','Recipe ready','Paneer Tikka Bowl was added to your cookbook.',0,datetime('now','-2 minutes')),
('not_demo_expiry','demo-user','clock','Use your spinach soon','It expires tomorrow. We found 2 recipes for it.',0,datetime('now','-1 hour')),
('not_demo_cook_now','demo-user','zap','You can cook this now','Miso Butter Noodles matches your pantry 100%.',0,datetime('now','-3 hours'));

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL COLLATE NOCASE,
  quantity TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS shopping_list_user_created_idx ON shopping_list_items(user_id, created_at DESC);
