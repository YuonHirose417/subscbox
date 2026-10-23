import { create } from 'zustand';

import { buildSampleData } from '@/data/sampleSubscriptions';
import { InMemorySubscriptionRepository } from '@/db/repositories/InMemorySubscriptionRepository';
import type { SubscriptionRepository } from '@/db/repositories/SubscriptionRepository';
import { today as todayString } from '@/domain/dates';
import type { PriceHistoryEntry, Subscription, SubscriptionInput } from '@/domain/types';
import { logger } from '@/utils/logger';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

type SubscriptionState = {
  items: Subscription[];
  priceHistory: PriceHistoryEntry[];
  status: LoadStatus;
  load: () => Promise<void>;
  create: (input: SubscriptionInput) => Promise<Subscription>;
  update: (id: string, input: Partial<SubscriptionInput>) => Promise<Subscription>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<Subscription>;
  cancel: (id: string) => Promise<Subscription>;
};

// フェーズ2はサンプルデータ入りのメモリ実装。フェーズ3で SQLite 実装に差し替える
let repository: SubscriptionRepository = new InMemorySubscriptionRepository(buildSampleData());

/** 開発用：リポジトリを差し替えて読み直す（空状態の確認など） */
export async function replaceRepositoryForDev(next: SubscriptionRepository) {
  repository = next;
  await useSubscriptionStore.getState().load();
}

/**
 * サブスク一覧のメモリキャッシュ。正（Source of Truth）はリポジトリ。
 * 書き込みはリポジトリ → 成功後に読み直す（楽観的更新はしない）。
 */
export const useSubscriptionStore = create<SubscriptionState>((set, get) => {
  async function refresh() {
    const [items, priceHistory] = await Promise.all([
      repository.list({ status: 'all' }),
      repository.getPriceHistory(),
    ]);
    set({ items, priceHistory, status: 'ready' });
  }

  return {
    items: [],
    priceHistory: [],
    status: 'idle',

    async load() {
      if (get().status !== 'ready') set({ status: 'loading' });
      try {
        await repository.rollForwardRenewals(todayString());
        await refresh();
      } catch (error) {
        logger.error('failed to load subscriptions', error);
        set({ status: 'error' });
      }
    },

    async create(input) {
      const created = await repository.create(input);
      await refresh();
      return created;
    },

    async update(id, input) {
      const updated = await repository.update(id, input);
      await refresh();
      return updated;
    },

    async remove(id) {
      await repository.remove(id);
      await refresh();
    },

    async duplicate(id) {
      const copy = await repository.duplicate(id);
      await refresh();
      return copy;
    },

    async cancel(id) {
      const cancelled = await repository.cancel(id, new Date().toISOString());
      await refresh();
      return cancelled;
    },
  };
});
