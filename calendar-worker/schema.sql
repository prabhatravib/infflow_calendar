<<<<<<< HEAD
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE
);

=======
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Calendars table
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
CREATE TABLE IF NOT EXISTS calendars (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
<<<<<<< HEAD
  FOREIGN KEY(user_id) REFERENCES users(id)
);

=======
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Events table
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
<<<<<<< HEAD
  start TEXT NOT NULL,   -- ISO8601 UTC
  end TEXT NOT NULL,     -- ISO8601 UTC
  tz TEXT NOT NULL,
  type TEXT DEFAULT 'regular',
  flowchart TEXT,
  echo_event_ids TEXT,   -- JSON array of related event IDs
=======
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  tz TEXT NOT NULL DEFAULT 'UTC',
  type TEXT,
  flowchart TEXT,
  echo_event_ids TEXT,
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
  parent_event_id TEXT,
  user_id TEXT,
  eventType TEXT DEFAULT 'other',
  location TEXT,
<<<<<<< HEAD
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(calendar_id) REFERENCES calendars(id)
);

CREATE INDEX IF NOT EXISTS idx_events_cal_start ON events(calendar_id, start);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_parent ON events(parent_event_id);
=======
  source TEXT DEFAULT 'local',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (calendar_id) REFERENCES calendars(id),
  FOREIGN KEY (parent_event_id) REFERENCES events(id)
);

-- Simple Google OAuth tokens table
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  user_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry TEXT,
  scope TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_calendar_id ON events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start);
CREATE INDEX IF NOT EXISTS idx_events_end ON events(end);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_user_id ON google_oauth_tokens(user_id);
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
