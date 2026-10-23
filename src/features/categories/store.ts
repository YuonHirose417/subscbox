import { create } from 'zustand';

import { defaultCategories } from '@/data/defaultCategories';
import type { Category } from '@/domain/types';

type CategoryState = { items: Category[] };

// フェーズ3で categories テーブルから読み込む（自作カテゴリ対応）。現時点は既定6種のみ
export const useCategoryStore = create<CategoryState>(() => ({
  items: [...defaultCategories],
}));

export function useCategories(): Category[] {
  return useCategoryStore((s) => s.items);
}
