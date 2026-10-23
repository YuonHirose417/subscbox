import { create } from 'zustand';

import { defaultCategories } from '@/data/defaultCategories';
import type { CategoryRepository } from '@/db/repositories/CategoryRepository';
import type { Category, CategoryInput } from '@/domain/types';
import { FREE_LIMITS, LimitReachedError } from '@/features/premium/limits';

type CategoryState = {
  items: Category[];
  load: () => Promise<void>;
  /** 自作カテゴリの追加。無料版は FREE_LIMITS.customCategories 件まで */
  create: (input: CategoryInput, isPremium: boolean) => Promise<Category>;
  remove: (id: string) => Promise<void>;
};

let repository: CategoryRepository | null = null;

export function setCategoryRepository(next: CategoryRepository) {
  repository = next;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  items: [...defaultCategories],

  async load() {
    if (!repository) return;
    set({ items: await repository.list() });
  },

  async create(input, isPremium) {
    if (!repository) throw new Error('CategoryRepository is not set');
    if (!isPremium && (await repository.countCustom()) >= FREE_LIMITS.customCategories) {
      throw new LimitReachedError(
        `無料版で追加できるカテゴリは${FREE_LIMITS.customCategories}件までです`,
      );
    }
    const created = await repository.create(input);
    set({ items: await repository.list() });
    return created;
  },

  async remove(id) {
    if (!repository) throw new Error('CategoryRepository is not set');
    await repository.remove(id);
    set({ items: await repository.list() });
  },
}));

export function useCategories(): Category[] {
  return useCategoryStore((s) => s.items);
}
