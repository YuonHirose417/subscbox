import { buildSampleData } from '@/data/sampleSubscriptions';
import { toInput } from '@/domain/subscription';

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
