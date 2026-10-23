import * as SQLite from 'expo-sqlite';

import { AppError } from '@/utils/errors';

import type { Db, SqlValue } from './adapter';
import { migrate } from './migrations';

export const DATABASE_NAME = 'subscbox.db';

type Executor = Pick<
  SQLite.SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getAllAsync' | 'getFirstAsync'
>;

function wrap(
  executor: Executor,
  transaction: (fn: (tx: Db) => Promise<void>) => Promise<void>,
): Db {
  return {
    exec: (sql) => executor.execAsync(sql),
    run: async (sql, params = []) => {
      const result = await executor.runAsync(sql, params as SqlValue[]);
      return { changes: result.changes };
    },
    all: <T>(sql: string, params: readonly SqlValue[] = []) =>
      executor.getAllAsync<T>(sql, params as SqlValue[]),
    first: <T>(sql: string, params: readonly SqlValue[] = []) =>
      executor.getFirstAsync<T>(sql, params as SqlValue[]),
    transaction,
  };
}

function fromExpo(database: SQLite.SQLiteDatabase): Db {
  const transaction = (fn: (tx: Db) => Promise<void>) =>
    database.withExclusiveTransactionAsync(async (txn) => {
      // ネストしたトランザクションは同じ txn 上でそのまま実行する
      const inner: Db = wrap(txn, (nested) => nested(inner));
      await fn(inner);
    });
  return wrap(database, transaction);
}

let instance: Promise<Db> | null = null;

/** DB を開いてマイグレーションを適用する（アプリ内で1つだけ） */
export function getDb(): Promise<Db> {
  if (!instance) {
    instance = (async () => {
      try {
        const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
        await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
        const db = fromExpo(database);
        await migrate(db);
        return db;
      } catch (error) {
        instance = null; // 再試行できるようにする
        throw new AppError('DB_READ', 'failed to open database', error);
      }
    })();
  }
  return instance;
}
