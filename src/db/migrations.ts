import { defaultCategories } from '@/data/defaultCategories';

import type { Db } from './adapter';

type Migration = { version: number; up: (db: Db) => Promise<void> };

const V1_SCHEMA = `
CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,
  icon        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE payment_methods (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('credit_card','debit_card','apple_id','carrier','other')),
  label       TEXT,
  last4       TEXT CHECK (last4 IS NULL OR (length(last4) = 4 AND last4 GLOB '[0-9][0-9][0-9][0-9]')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE subscriptions (
  id                   TEXT PRIMARY KEY,
  service_key          TEXT,
  name                 TEXT NOT NULL,
  plan_name            TEXT,
  amount_minor         INTEGER NOT NULL CHECK (amount_minor > 0),
  currency             TEXT NOT NULL DEFAULT 'JPY',
  cycle_unit           TEXT NOT NULL CHECK (cycle_unit IN ('week','month','year')),
  cycle_interval       INTEGER NOT NULL DEFAULT 1 CHECK (cycle_interval >= 1),
  start_date           TEXT NOT NULL,
  next_renewal_date    TEXT NOT NULL,
  category_id          TEXT NOT NULL REFERENCES categories(id),
  icon_type            TEXT NOT NULL DEFAULT 'monogram' CHECK (icon_type IN ('monogram','symbol','image')),
  icon_value           TEXT,
  icon_color           TEXT,
  payment_method_id    TEXT REFERENCES payment_methods(id) ON DELETE SET NULL,
  url                  TEXT,
  memo                 TEXT,
  notify_enabled       INTEGER NOT NULL DEFAULT 1,
  notify_days_before   INTEGER NOT NULL DEFAULT 3,
  notify_time          TEXT NOT NULL DEFAULT '09:00',
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  cancelled_at         TEXT,
  last_used_date       TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);
CREATE INDEX idx_subscriptions_next_renewal ON subscriptions(next_renewal_date);
CREATE INDEX idx_subscriptions_category ON subscriptions(category_id);

CREATE TABLE price_history (
  id              TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount_minor    INTEGER NOT NULL,
  currency        TEXT NOT NULL,
  cycle_unit      TEXT NOT NULL,
  cycle_interval  INTEGER NOT NULL,
  effective_from  TEXT NOT NULL,
  created_at      TEXT NOT NULL
);
CREATE INDEX idx_price_history_sub ON price_history(subscription_id, effective_from);

CREATE TABLE payments (
  id              TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  billed_on       TEXT NOT NULL,
  amount_minor    INTEGER NOT NULL,
  currency        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','skipped')),
  is_user_edited  INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  UNIQUE (subscription_id, billed_on)
);
CREATE INDEX idx_payments_billed_on ON payments(billed_on);

CREATE TABLE scheduled_notifications (
  notification_id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  fire_at         TEXT NOT NULL
);

CREATE TABLE exchange_rates (
  currency    TEXT PRIMARY KEY,
  rate_to_jpy REAL NOT NULL CHECK (rate_to_jpy > 0),
  updated_at  TEXT NOT NULL
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const migrations: readonly Migration[] = [
  {
    version: 1,
    async up(db) {
      await db.exec(V1_SCHEMA);
      const now = new Date().toISOString();
      for (const c of defaultCategories) {
        await db.run(
          `INSERT INTO categories (id, name, color, icon, sort_order, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
          [c.id, c.name, c.color, c.icon, c.sortOrder, now, now],
        );
      }
    },
  },
];

export const LATEST_VERSION = migrations[migrations.length - 1].version;

/** PRAGMA user_version を見て未適用のマイグレーションを順に適用する（各々トランザクション内） */
export async function migrate(db: Db): Promise<number> {
  const row = await db.first<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;
  for (const m of migrations) {
    if (m.version <= current) continue;
    await db.transaction(async (tx) => {
      await m.up(tx);
      await tx.exec(`PRAGMA user_version = ${m.version}`);
    });
    current = m.version;
  }
  return current;
}
