import { useEffect } from 'react';

import { usePremiumStore } from '@/features/premium/usePremium';
import { startAds } from '@/services/ads';

/** 起動処理が終わり、無料版だと確認できたら広告を準備する（プレミアムでは広告 SDK を初期化しない） */
export function useAdsBootstrap(ready: boolean): void {
  const checked = usePremiumStore((s) => s.checked);
  const isPremium = usePremiumStore((s) => s.isPremium);
  useEffect(() => {
    if (ready && checked && !isPremium) void startAds();
  }, [ready, checked, isPremium]);
}
