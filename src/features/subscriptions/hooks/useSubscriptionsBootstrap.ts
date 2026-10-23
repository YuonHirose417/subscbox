import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useSubscriptionStore } from '../store';

/** 起動時とフォアグラウンド復帰時に、更新日の繰り越し → 読み込みを行う */
export function useSubscriptionsBootstrap() {
  const load = useSubscriptionStore((s) => s.load);
  useEffect(() => {
    load();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);
}
