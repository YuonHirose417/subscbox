import { useCallback, useEffect, useState } from 'react';

import { buildSampleData } from '@/data/sampleSubscriptions';
import { InMemorySubscriptionRepository } from '@/db/repositories/InMemorySubscriptionRepository';
import { today as todayString } from '@/domain/dates';
import { planPaymentSync } from '@/domain/payments';
import type { Payment } from '@/domain/types';
import { usePaymentStore } from '@/features/payments/store';
import { setSubscriptionRepository, useSubscriptionStore } from '@/features/subscriptions/store';

export type InitStatus = 'loading' | 'ready' | 'error';

/**
 * Web 版（開発時のレイアウト確認専用。配布対象外）。expo-sqlite は Web の静的出力で動かないため、
 * サンプルデータをメモリに読み込んで表示だけ確認できるようにする。保存・通知・バックアップは動かない。
 */
export function useAppInit(): { status: InitStatus; retry: () => void } {
  const [status, setStatus] = useState<InitStatus>('loading');

  useEffect(() => {
    (async () => {
      const seed = buildSampleData();
      setSubscriptionRepository(new InMemorySubscriptionRepository(seed));
      await useSubscriptionStore.getState().load();
      const today = todayString();
      const payments: Payment[] = seed.subscriptions.flatMap((sub) =>
        planPaymentSync(sub, seed.priceHistory, [], today).toInsert.map((draft, i) => ({
          ...draft,
          id: `${sub.id}-${i}`,
          status: 'paid' as const,
          isUserEdited: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      );
      usePaymentStore.setState({ items: payments });
      setStatus('ready');
    })().catch(() => setStatus('error'));
  }, []);

  const retry = useCallback(() => setStatus('loading'), []);
  return { status, retry };
}
