import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { initRepositories } from '@/db';
import { setCategoryRepository, useCategoryStore } from '@/features/categories/store';
import { setPaymentMethodRepository, usePaymentMethodStore } from '@/features/paymentMethods/store';
import { startNotificationSync } from '@/features/notifications/sync';
import { startPaymentSync } from '@/features/payments/store';
import { hydrateSettings } from '@/features/settings/store';
import { removeUnusedIconImages } from '@/features/subscriptions/iconImages';
import { setSubscriptionRepository, useSubscriptionStore } from '@/features/subscriptions/store';
import { logger } from '@/utils/logger';

export type InitStatus = 'loading' | 'ready' | 'error';

/**
 * 起動処理：DB を開く（マイグレーション）→ 設定・カテゴリ・支払い方法を読み込む →
 * 次回更新日の繰り越し → サブスクを読み込む → 支払い履歴を同期 → 通知を予約し直す。
 * フォアグラウンド復帰時は繰り越しと再読み込み（一覧の変化を受けて支払い履歴・通知も追従する）。
 */
export function useAppInit(): { status: InitStatus; retry: () => void } {
  const [status, setStatus] = useState<InitStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const repos = await initRepositories();
        setSubscriptionRepository(repos.subscriptions);
        setCategoryRepository(repos.categories);
        setPaymentMethodRepository(repos.paymentMethods);
        await hydrateSettings(repos.settings);
        await Promise.all([
          useCategoryStore.getState().load(),
          usePaymentMethodStore.getState().load(),
        ]);
        await useSubscriptionStore.getState().load();
        // 差し替え・削除で使われなくなったアイコン画像を片付ける
        {
          const { status, items } = useSubscriptionStore.getState();
          // 読み込みに失敗したとき（items が空）に画像を消してしまわないよう、成功時だけ片付ける
          if (status === 'ready') removeUnusedIconImages(items);
        }
        await startPaymentSync(repos.payments);
        // 通知の予約は失敗しても起動は続ける（権限の要求はここではしない）
        startNotificationSync(repos.notifications).catch((e) =>
          logger.error('notification sync', e),
        );
        if (!cancelled) setStatus('ready');
      } catch (error) {
        logger.error('app init failed', error);
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (status !== 'ready') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') useSubscriptionStore.getState().load();
    });
    return () => sub.remove();
  }, [status]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }, []);

  return { status, retry };
}
