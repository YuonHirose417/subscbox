import { create } from 'zustand';

import type { PaymentRepository } from '@/db/repositories/PaymentRepository';
import { today as todayString } from '@/domain/dates';
import type { DateString, Payment } from '@/domain/types';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { logger } from '@/utils/logger';

type PaymentState = {
  /** 削除済み（skipped）を含むすべての行。表示には visiblePayments() を通す */
  items: Payment[];
  load: () => Promise<void>;
  edit: (id: string, patch: { billedOn?: DateString; amountMinor?: number }) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

let repository: PaymentRepository | null = null;

function repo(): PaymentRepository {
  if (!repository) throw new Error('PaymentRepository is not set');
  return repository;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  items: [],
  async load() {
    if (!repository) return;
    set({ items: await repository.listAll() });
  },
  async edit(id, patch) {
    await repo().edit(id, patch);
    set({ items: await repo().listAll() });
  },
  async remove(id) {
    await repo().remove(id);
    set({ items: await repo().listAll() });
  },
}));

let running: Promise<void> | null = null;
let pending = false;

/** サブスク・料金履歴から支払い履歴を今日まで同期し、読み直す（同時実行はまとめる） */
async function syncNow(): Promise<void> {
  if (running) {
    pending = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        pending = false;
        const { items, priceHistory } = useSubscriptionStore.getState();
        await repo().sync(items, priceHistory, todayString());
        await usePaymentStore.getState().load();
      } while (pending);
    } catch (error) {
      logger.error('failed to sync payments', error);
    } finally {
      running = null;
    }
  })();
  return running;
}

let unsubscribe: (() => void) | null = null;

/**
 * 起動時に呼ぶ。以後、サブスクの一覧・料金履歴が変わるたびに支払い履歴を同期する
 * （プレミアムでなくても生成しておき、アップグレード後すぐ見られるようにする）。
 */
export async function startPaymentSync(next: PaymentRepository): Promise<void> {
  repository = next;
  unsubscribe?.();
  unsubscribe = useSubscriptionStore.subscribe((state, prev) => {
    if (state.items !== prev.items || state.priceHistory !== prev.priceHistory) void syncNow();
  });
  await syncNow();
}
