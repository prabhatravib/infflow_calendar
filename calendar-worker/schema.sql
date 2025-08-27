CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS calendars (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start TEXT NOT NULL,   -- ISO8601 UTC
  end TEXT NOT NULL,     -- ISO8601 UTC
  tz TEXT NOT NULL,
  type TEXT DEFAULT 'regular',
  flowchart TEXT,
  echo_event_ids TEXT,   -- JSON array of related event IDs
  parent_event_id TEXT,
  user_id TEXT,
  eventType TEXT DEFAULT 'other',
  location TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(calendar_id) REFERENCES calendars(id)
);

CREATE INDEX IF NOT EXISTS idx_events_cal_start ON events(calendar_id, start);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_parent ON events(parent_event_id);
