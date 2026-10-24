import { useEffect } from 'react';
import { create } from 'zustand';

import { premiumService } from '@/services/premium';

type PremiumState = { isPremium: boolean; setIsPremium: (value: boolean) => void };

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  setIsPremium: (isPremium) => set({ isPremium }),
}));

let subscribed = false;

/** プレミアム状態の購読を始める（何度呼んでもよい） */
export function ensureSubscribed() {
  if (subscribed) return;
  subscribed = true;
  premiumService.onStatusChange((value) => usePremiumStore.getState().setIsPremium(value));
  premiumService
    .getStatus()
    .then(({ isPremium }) => usePremiumStore.getState().setIsPremium(isPremium))
    .catch(() => {});
}

export function usePremium(): { isPremium: boolean } {
  useEffect(ensureSubscribed, []);
  const isPremium = usePremiumStore((s) => s.isPremium);
  return { isPremium };
}
