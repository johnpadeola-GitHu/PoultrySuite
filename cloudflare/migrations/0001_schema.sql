-- ─────────────────────────────────────────────────────────────────────
-- PoultrySuite Africa — Cloudflare D1 Schema
-- ─────────────────────────────────────────────────────────────────────
-- Replaces the full Supabase PostgreSQL schema. D1 uses SQLite, so:
--   • No ENUM types (use TEXT with CHECK constraints)
--   • No gen_random_uuid() (use hex(randomblob(16)) or generate in Worker)
--   • No RLS (access control enforced in the Worker layer)
--   • No auth.users (we manage our own users table)
-- ─────────────────────────────────────────────────────────────────────

-- 1. Users (replaces Supabase auth.users) ─────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_sign_in  TEXT,
  reset_token   TEXT,
  reset_expires TEXT
);

-- 2. Profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  active_farm_id  TEXT,
  display_name    TEXT,
  phone           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Farms ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farms (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Farm members ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farm_members (
  id        TEXT PRIMARY KEY,
  farm_id   TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner','admin','manager','member','viewer')),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(farm_id, user_id)
);

-- 5. Devices ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
  id            TEXT PRIMARY KEY,
  farm_id       TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  device_token  TEXT NOT NULL UNIQUE,
  platform      TEXT,
  registered_by TEXT REFERENCES users(id),
  last_seen_at  TEXT,
  revoked       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Pairing codes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pairing_codes (
  id          TEXT PRIMARY KEY,
  farm_id     TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL DEFAULT 'New device',
  created_by  TEXT REFERENCES users(id),
  expires_at  TEXT NOT NULL,
  redeemed    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Batches ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batches (
  id            TEXT NOT NULL,
  farm_id       TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  house_id      TEXT,
  name          TEXT NOT NULL,
  breed         TEXT,
  source        TEXT,
  type          TEXT,
  initial_count INTEGER NOT NULL DEFAULT 0,
  current_count INTEGER NOT NULL DEFAULT 0,
  start_date    TEXT,
  status        TEXT NOT NULL DEFAULT 'Active',
  notes         TEXT,
  deleted       INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (farm_id, id)
);

-- 8. Farm records (generic collection sync) ───────────────────────────
CREATE TABLE IF NOT EXISTS farm_records (
  farm_id     TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  collection  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  data        TEXT NOT NULL,  -- JSON
  deleted     INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (farm_id, collection, record_id)
);

-- 9. Plans ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id                  TEXT PRIMARY KEY,
  tier                TEXT NOT NULL UNIQUE CHECK(tier IN ('starter','professional','enterprise')),
  name                TEXT NOT NULL,
  description         TEXT,
  annual_price_minor  INTEGER NOT NULL,
  currency_code       TEXT NOT NULL DEFAULT 'NGN',
  max_devices         INTEGER NOT NULL DEFAULT 2,
  max_flocks          INTEGER,
  has_hatchery        INTEGER NOT NULL DEFAULT 0,
  has_feedmill        INTEGER NOT NULL DEFAULT 0,
  has_analytics       INTEGER NOT NULL DEFAULT 0,
  is_active           INTEGER NOT NULL DEFAULT 1,
  display_order       INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed plans
INSERT OR IGNORE INTO plans (id, tier, name, description, annual_price_minor, currency_code, max_devices, max_flocks, has_hatchery, has_feedmill, has_analytics, display_order)
VALUES
  ('plan_starter', 'starter', 'Starter', 'Small farms getting started.', 15000000, 'NGN', 2, 3, 0, 0, 0, 1),
  ('plan_professional', 'professional', 'Professional', 'Growing farms with a team.', 45000000, 'NGN', 5, 15, 1, 0, 1, 2),
  ('plan_enterprise', 'enterprise', 'Enterprise', 'Multi-branch operators.', 120000000, 'NGN', 15, NULL, 1, 1, 1, 3);

-- 10. Subscriptions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    TEXT PRIMARY KEY,
  farm_id               TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  plan_id               TEXT NOT NULL REFERENCES plans(id),
  status                TEXT NOT NULL DEFAULT 'trialing' CHECK(status IN ('trialing','active','past_due','canceled')),
  period_start          TEXT,
  period_end            TEXT,
  max_devices_override  INTEGER,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. Payments ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id            TEXT PRIMARY KEY,
  farm_id       TEXT REFERENCES farms(id),
  plan_tier     TEXT,
  amount_minor  INTEGER NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'NGN',
  reference     TEXT NOT NULL UNIQUE,
  email         TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','success','failed')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. Support tickets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          TEXT PRIMARY KEY,
  farm_id     TEXT REFERENCES farms(id) ON DELETE CASCADE,
  raised_by   TEXT REFERENCES users(id),
  subject     TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed')),
  priority    TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- 13. Platform admins ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  granted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  notes       TEXT
);

-- Indexes for common queries ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_farm_members_user ON farm_members(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id);
CREATE INDEX IF NOT EXISTS idx_devices_farm ON devices(farm_id);
CREATE INDEX IF NOT EXISTS idx_devices_token ON devices(device_token);
CREATE INDEX IF NOT EXISTS idx_batches_farm ON batches(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_records_lookup ON farm_records(farm_id, collection, deleted);
CREATE INDEX IF NOT EXISTS idx_subscriptions_farm ON subscriptions(farm_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_tickets_farm ON support_tickets(farm_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
