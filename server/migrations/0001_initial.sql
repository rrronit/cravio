PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  creator TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL,
  source_url TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  prep_time INTEGER NOT NULL DEFAULT 0,
  cook_time INTEGER NOT NULL DEFAULT 0,
  servings INTEGER NOT NULL DEFAULT 1,
  cuisine TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'Easy',
  tags_json TEXT NOT NULL DEFAULT '[]',
  ingredients_json TEXT NOT NULL DEFAULT '[]',
  instructions_json TEXT NOT NULL DEFAULT '[]',
  nutrition_json TEXT NOT NULL DEFAULT '{}',
  favorite INTEGER NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0,
  warnings_json TEXT NOT NULL DEFAULT '[]',
  imported_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS recipes_imported_at_idx ON recipes(imported_at DESC);
CREATE INDEX IF NOT EXISTS recipes_favorite_idx ON recipes(favorite);

CREATE TABLE IF NOT EXISTS pantry_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  expiry TEXT,
  available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS pantry_available_idx ON pantry_items(available);

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  recipe_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS import_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES import_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS import_events_job_idx ON import_events(job_id, id);
