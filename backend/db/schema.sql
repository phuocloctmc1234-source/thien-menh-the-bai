-- Database của Thiên Mệnh Thẻ Bài (SQLite)
PRAGMA foreign_keys = ON;

-- Người chơi
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Lượt chơi đang dở (mỗi người 1 bản lưu)
CREATE TABLE IF NOT EXISTS saves (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT    NOT NULL,            -- JSON trạng thái lượt chơi
  hero       TEXT,
  act        INTEGER,
  floor      INTEGER,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Lịch sử các lượt chơi đã kết thúc (dùng cho bảng xếp hạng & thống kê)
CREATE TABLE IF NOT EXISTS runs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hero       TEXT    NOT NULL,
  win        INTEGER NOT NULL DEFAULT 0,  -- 1 = thắng Ma Vương
  act        INTEGER NOT NULL,
  floor      INTEGER NOT NULL,
  kills      INTEGER NOT NULL DEFAULT 0,
  gold       INTEGER NOT NULL DEFAULT 0,
  deck_size  INTEGER NOT NULL DEFAULT 0,
  score      INTEGER NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_runs_score ON runs(score DESC);
CREATE INDEX IF NOT EXISTS idx_runs_user  ON runs(user_id, created_at DESC);
