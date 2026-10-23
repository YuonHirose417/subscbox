import type { Db } from '../adapter';

/** key-value の設定。値は JSON 文字列で保存する */
export class SettingsRepository {
  constructor(private readonly db: Db) {}

  async getAll(): Promise<Record<string, unknown>> {
    const rows = await this.db.all<{ key: string; value: string }>(
      'SELECT key, value FROM settings',
    );
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        // 壊れた値は無視して既定値を使う
      }
    }
    return result;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, JSON.stringify(value)],
    );
  }
}
