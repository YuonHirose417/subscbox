import type { Subscription } from '@/domain/types';

let seq = 0;

export function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  seq += 1;
  return {
    id: `sub-${seq}`,
    serviceKey: null,
    name: `Service ${seq}`,
    planName: null,
    amountMinor: 1000,
    currency: 'JPY',
    cycle: { unit: 'month', interval: 1 },
    startDate: '2025-01-15',
    nextRenewalDate: '2025-11-15',
    categoryId: 'other',
    icon: { type: 'monogram', value: null, color: null },
    paymentMethodId: null,
    url: null,
    memo: null,
    notification: { enabled: true, daysBefore: 3, time: '09:00' },
    status: 'active',
    cancelledAt: null,
    lastUsedDate: null,
    createdAt: `2025-01-01T00:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}
