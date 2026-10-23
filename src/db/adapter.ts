export type SqlValue = string | number | null;

/**
 * Repository が使う最小限の DB 操作。アプリでは expo-sqlite、
 * テストでは Node の node:sqlite で実装し、同じ SQL を両方で検証する。
 */
export interface Db {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: readonly SqlValue[]): Promise<{ changes: number }>;
  all<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
  first<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null>;
  /** 排他トランザクション。fn が例外を投げたらロールバックする */
  transaction(fn: (tx: Db) => Promise<void>): Promise<void>;
}
