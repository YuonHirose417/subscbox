import { popularServices } from '@/data/popularServices';
import { buildSampleData } from '@/data/sampleSubscriptions';
import { firstBillingOnOrAfter } from '@/domain/billing';
import { addDays, today as todayString } from '@/domain/dates';
import { toInput } from '@/domain/subscription';
import type { Subscription } from '@/domain/types';

import { getDb } from './client';
import { inputToColumns } from './mappers';
import { insert } from './sql';

/** 開発用：すべてのサブスクを削除してカンプ相当のサンプルデータを投入する */
export async function seedSampleDataForDev(): Promise<void> {
  if (!__DEV__) return;
  const db = await getDb();
  const { subscriptions, priceHistory } = buildSampleData();
  await db.transaction(async (tx) => {
    await tx.run('DELETE FROM subscriptions');
    for (const sub of subscriptions) {
      await insert(tx, 'subscriptions', {
        ...inputToColumns(toInput(sub)),
        id: sub.id,
        status: sub.status,
        cancelled_at: sub.cancelledAt,
        created_at: sub.createdAt,
        updated_at: sub.updatedAt,
      });
    }
    for (const h of priceHistory) {
      await insert(tx, 'price_history', {
        id: h.id,
        subscription_id: h.subscriptionId,
        amount_minor: h.amountMinor,
        currency: h.currency,
        cycle_unit: h.cycle.unit,
        cycle_interval: h.cycle.interval,
        effective_from: h.effectiveFrom,
        created_at: new Date().toISOString(),
      });
    }
  });
}

/** 開発用：すべてのサブスクを削除する（空状態の確認用） */
export async function clearSubscriptionsForDev(): Promise<void> {
  if (!__DEV__) return;
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.run('DELETE FROM subscriptions');
  });
}

/** 開発用：一覧のスクロール性能を確認するため、ダミーのサブスクを count 件追加する */
export async function seedManyForDev(count = 100): Promise<void> {
  if (!__DEV__) return;
  const db = await getDb();
  const base = buildSampleData().subscriptions[0];
  const now = new Date().toISOString();
  const today = todayString();
  const units = ['week', 'month', 'month', 'month', 'year'] as const;
  await db.transaction(async (tx) => {
    for (let i = 0; i < count; i += 1) {
      const preset = popularServices[i % popularServices.length];
      const unit = units[i % units.length];
      const startDate = addDays(today, -((i * 37) % 700) - 1);
      const cycle = { unit, interval: 1 };
      const sub: Subscription = {
        ...base,
        id: `dummy-${i}-${Date.now().toString(36)}`,
        serviceKey: preset.key,
        name: `${preset.name} ${i + 1}`,
        planName: i % 3 === 0 ? null : 'ダミープラン',
        amountMinor: 100 + ((i * 7919) % 9900),
        currency: 'JPY',
        cycle,
        startDate,
        nextRenewalDate: firstBillingOnOrAfter(startDate, cycle, today, 1),
        categoryId: preset.categoryId,
        icon: { type: 'monogram', value: null, color: null },
        paymentMethodId: null,
        url: null,
        memo: null,
        lastUsedDate: null,
        status: 'active',
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
      };
      await insert(tx, 'subscriptions', {
        ...inputToColumns(toInput(sub)),
        id: sub.id,
        status: sub.status,
        cancelled_at: null,
        created_at: sub.createdAt,
        updated_at: sub.updatedAt,
      });
    }
  });
}
