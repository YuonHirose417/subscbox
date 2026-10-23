import { create } from 'zustand';

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
  reactivate: (id: string) => Promise<Subscription>;
};

let current: SubscriptionRepository | null = null;

/** 起動時に SQLite 実装を設定する（テストでは InMemory 実装を渡せる） */
export function setSubscriptionRepository(next: SubscriptionRepository) {
  current = next;
}

function repo(): SubscriptionRepository {
  if (!current) throw new Error('SubscriptionRepository is not set');
  return current;
}

/**
 * サブスク一覧のメモリキャッシュ。正（Source of Truth）はリポジトリ。
 * 書き込みはリポジトリ → 成功後に読み直す（楽観的更新はしない）。
 */
export const useSubscriptionStore = create<SubscriptionState>((set, get) => {
  async function refresh() {
    const [items, priceHistory] = await Promise.all([
      repo().list({ status: 'all' }),
      repo().getPriceHistory(),
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
        await repo().rollForwardRenewals(todayString());
        await refresh();
      } catch (error) {
        logger.error('failed to load subscriptions', error);
        set({ status: 'error' });
      }
    },

    async create(input) {
      const created = await repo().create(input);
      await refresh();
      return created;
    },

    async update(id, input) {
      const updated = await repo().update(id, input);
      await refresh();
      return updated;
    },

    async remove(id) {
      await repo().remove(id);
      await refresh();
    },

    async duplicate(id) {
      const copy = await repo().duplicate(id);
      await refresh();
      return copy;
    },

    async cancel(id) {
      const cancelled = await repo().cancel(id, new Date().toISOString());
      await refresh();
      return cancelled;
    },

    async reactivate(id) {
      const active = await repo().reactivate(id);
      await refresh();
      return active;
    },
  };
});
