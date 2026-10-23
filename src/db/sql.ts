import type { Db, SqlValue } from './adapter';

/** 列名→値のオブジェクトから INSERT を組み立てる（列名はコード内の定数のみ渡すこと） */
export function insert(db: Db, table: string, columns: Record<string, SqlValue>) {
  const keys = Object.keys(columns);
  return db.run(
    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    keys.map((k) => columns[k]),
  );
}
