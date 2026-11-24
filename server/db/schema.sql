-- Find a Guide Rwanda - database schema (SQLite)
-- Applied automatically on server start (all statements are idempotent).
-- User -> Tourist / Tour Guide / Administrator is modelled as one "users" table
-- plus one profile table per role (class inheritance from the UML diagram).

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('Tourist','Guide','Admin')),
  status        TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Suspended')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS tourist_profiles (
  user_id            TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nationality        TEXT NOT NULL,
  preferred_language TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_profiles (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  admin_level TEXT NOT NULL DEFAULT 'Standard'
);

CREATE TABLE IF NOT EXISTS guide_profiles (
  user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio                 TEXT NOT NULL DEFAULT '',
  photo_url           TEXT,
  languages           TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  experience_years    INTEGER NOT NULL DEFAULT 0,
  specialization      TEXT NOT NULL DEFAULT '',
  location            TEXT NOT NULL DEFAULT '',
  price_rwf           INTEGER NOT NULL DEFAULT 0,
  price_usd           INTEGER NOT NULL DEFAULT 0,
  services            TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  verification_status TEXT NOT NULL DEFAULT 'Pending' CHECK (verification_status IN ('Pending','Verified','Rejected')),
  rejection_reason    TEXT,
  average_rating      REAL NOT NULL DEFAULT 0,
  review_count        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS availability_dates (
  guide_id TEXT NOT NULL REFERENCES guide_profiles(user_id) ON DELETE CASCADE,
  date     TEXT NOT NULL,                            -- YYYY-MM-DD
  PRIMARY KEY (guide_id, date)
);

CREATE TABLE IF NOT EXISTS verification_documents (
  id          TEXT PRIMARY KEY,
  guide_id    TEXT NOT NULL REFERENCES guide_profiles(user_id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id          TEXT PRIMARY KEY,
  tourist_id  TEXT NOT NULL REFERENCES users(id),
  guide_id    TEXT NOT NULL REFERENCES users(id),
  destination TEXT NOT NULL,
  start_date  TEXT NOT NULL,
  end_date    TEXT NOT NULL,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed','Declined','Cancelled','Completed')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_guide   ON bookings(guide_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_tourist ON bookings(tourist_id, status);

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  sender_id   TEXT NOT NULL REFERENCES users(id),
  receiver_id TEXT NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  sent_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  is_read     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id, sent_at);

-- UNIQUE(booking_id) enforces "max one review per booking" (FR 10).
CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id),
  author_id  TEXT NOT NULL REFERENCES users(id),
  guide_id   TEXT NOT NULL REFERENCES users(id),
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT NOT NULL,
  is_hidden  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_guide ON reviews(guide_id, is_hidden);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS reports (
  id               TEXT PRIMARY KEY,
  reporter_id      TEXT NOT NULL REFERENCES users(id),
  reported_user_id TEXT NOT NULL REFERENCES users(id),
  reason           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Resolved','Dismissed')),
  resolution_note  TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
