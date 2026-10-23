import type { Category, CategoryInput } from '@/domain/types';
import { AppError } from '@/utils/errors';

import type { Db } from '../adapter';
import { rowToCategory, type CategoryRow } from '../mappers';
import { insert } from '../sql';

const FALLBACK_CATEGORY_ID = 'other';

export class CategoryRepository {
  constructor(
    private readonly db: Db,
    private readonly generateId: () => string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(): Promise<Category[]> {
    const rows = await this.db.all<CategoryRow>(
      'SELECT * FROM categories ORDER BY sort_order, created_at',
    );
    return rows.map(rowToCategory);
  }

  async countCustom(): Promise<number> {
    const row = await this.db.first<{ n: number }>(
      'SELECT COUNT(*) AS n FROM categories WHERE is_default = 0',
    );
    return row?.n ?? 0;
  }

  /** 自作カテゴリの追加（件数上限の判定は呼び出し側で行う） */
  async create(input: CategoryInput): Promise<Category> {
    const name = input.name.trim();
    if (name.length === 0 || name.length > 20) {
      throw new AppError('VALIDATION', 'カテゴリ名は1〜20文字で入力してください');
    }
    const id = this.generateId();
    const timestamp = this.now().toISOString();
    const max = await this.db.first<{ m: number | null }>(
      'SELECT MAX(sort_order) AS m FROM categories',
    );
    await this.db.transaction(async (tx) => {
      await insert(tx, 'categories', {
        id,
        name,
        color: input.color,
        icon: input.icon,
        sort_order: (max?.m ?? 0) + 1,
        is_default: 0,
        created_at: timestamp,
        updated_at: timestamp,
      });
    });
    const row = await this.db.first<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
    return rowToCategory(row!);
  }

  /** 自作カテゴリの削除。使っていたサブスクは「その他」に移す。既定カテゴリは削除できない */
  async remove(id: string): Promise<void> {
    const row = await this.db.first<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
    if (!row) throw new AppError('NOT_FOUND', `category ${id} not found`);
    if (row.is_default === 1) throw new AppError('VALIDATION', '既定のカテゴリは削除できません');
    await this.db.transaction(async (tx) => {
      await tx.run('UPDATE subscriptions SET category_id = ? WHERE category_id = ?', [
        FALLBACK_CATEGORY_ID,
        id,
      ]);
      await tx.run('DELETE FROM categories WHERE id = ?', [id]);
    });
  }
}
