import type { Db, SqlValue } from '@/db/adapter';

type Statement = {
  run(...params: SqlValue[]): { changes: number | bigint };
  all(...params: SqlValue[]): unknown[];
  get(...params: SqlValue[]): unknown;
};
type DatabaseSync = {
  exec(sql: string): void;
  prepare(sql: string): Statement;
  close(): void;
};

/** node:sqlite が使えるか（Node 22.5+。22.13 未満は --experimental-sqlite が必要） */
export function loadNodeSqlite(): { DatabaseSync: new (path: string) => DatabaseSync } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node:sqlite');
  } catch {
    return null;
  }
}

/** テスト用：メモリ上の SQLite を Db インターフェースで包む（アプリの expo-sqlite と同じ SQL を流す） */
export function createNodeSqliteDb(): Db & { close(): void } {
  const sqlite = loadNodeSqlite();
  if (!sqlite) throw new Error('node:sqlite is not available');
  const database = new sqlite.DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  let depth = 0;

  const db: Db & { close(): void } = {
    async exec(sql) {
      database.exec(sql);
    },
    async run(sql, params = []) {
      const result = database.prepare(sql).run(...params);
      return { changes: Number(result.changes) };
    },
    async all<T>(sql: string, params: readonly SqlValue[] = []) {
      return database.prepare(sql).all(...params) as T[];
    },
    async first<T>(sql: string, params: readonly SqlValue[] = []) {
      return (database.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async transaction(fn) {
      if (depth > 0) return fn(db);
      depth += 1;
      database.exec('BEGIN IMMEDIATE');
      try {
        await fn(db);
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      } finally {
        depth -= 1;
      }
    },
    close: () => database.close(),
  };
  return db;
}
