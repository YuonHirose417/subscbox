import { useEffect } from 'react';
import { create } from 'zustand';

import { premiumService } from '@/services/premium';

type PremiumState = {
  isPremium: boolean;
  /** 起動後、購入状態を一度でも確認できたか（広告 SDK を初期化してよいかの判断に使う） */
  checked: boolean;
  setIsPremium: (value: boolean) => void;
};

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  checked: false,
  setIsPremium: (isPremium) => set({ isPremium, checked: true }),
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
    .catch(() => usePremiumStore.setState({ checked: true }));
}

export function usePremium(): { isPremium: boolean } {
  useEffect(ensureSubscribed, []);
  const isPremium = usePremiumStore((s) => s.isPremium);
  return { isPremium };
}
