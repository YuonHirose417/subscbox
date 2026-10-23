import { create } from 'zustand';

import type { PaymentMethodRepository } from '@/db/repositories/PaymentMethodRepository';
import type { PaymentMethod, PaymentMethodInput } from '@/domain/types';
import { FREE_LIMITS, LimitReachedError } from '@/features/premium/limits';

type PaymentMethodState = {
  items: PaymentMethod[];
  load: () => Promise<void>;
  /** 無料版は FREE_LIMITS.paymentMethods 件まで */
  create: (input: PaymentMethodInput, isPremium: boolean) => Promise<PaymentMethod>;
  remove: (id: string) => Promise<void>;
};

let repository: PaymentMethodRepository | null = null;

export function setPaymentMethodRepository(next: PaymentMethodRepository) {
  repository = next;
}

function repo(): PaymentMethodRepository {
  if (!repository) throw new Error('PaymentMethodRepository is not set');
  return repository;
}

export const usePaymentMethodStore = create<PaymentMethodState>((set, get) => ({
  items: [],

  async load() {
    if (!repository) return;
    set({ items: await repository.list() });
  },

  async create(input, isPremium) {
    if (!isPremium && get().items.length >= FREE_LIMITS.paymentMethods) {
      throw new LimitReachedError(
        `無料版で登録できる支払い方法は${FREE_LIMITS.paymentMethods}件までです`,
      );
    }
    const created = await repo().create(input);
    set({ items: await repo().list() });
    return created;
  },

  async remove(id) {
    await repo().remove(id);
    set({ items: await repo().list() });
  },
}));
