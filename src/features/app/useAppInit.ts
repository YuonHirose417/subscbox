import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { initRepositories } from '@/db';
import { setCategoryRepository, useCategoryStore } from '@/features/categories/store';
import { setPaymentMethodRepository, usePaymentMethodStore } from '@/features/paymentMethods/store';
import { hydrateSettings } from '@/features/settings/store';
import { setSubscriptionRepository, useSubscriptionStore } from '@/features/subscriptions/store';
import { logger } from '@/utils/logger';

export type InitStatus = 'loading' | 'ready' | 'error';

/**
 * 起動処理：DB を開く（マイグレーション）→ 設定・カテゴリ・支払い方法を読み込む →
 * 次回更新日の繰り越し → サブスクを読み込む。フォアグラウンド復帰時は繰り越しと再読み込み。
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
