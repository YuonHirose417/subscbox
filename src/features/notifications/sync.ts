import { create } from 'zustand';

import type { NotificationRepository } from '@/db/repositories/NotificationRepository';
import { planNotifications } from '@/domain/notifications';
import { ensureSubscribed, usePremiumStore } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import {
  cancelAllScheduled,
  getPermissionState,
  replaceScheduled,
  type PermissionState,
} from '@/services/notifications';
import { logger } from '@/utils/logger';

type NotificationSyncState = {
  permission: PermissionState | null;
  /** 直近の入れ替えで予約した件数 */
  scheduledCount: number;
};

export const useNotificationSyncStore = create<NotificationSyncState>(() => ({
  permission: null,
  scheduledCount: 0,
}));

let repository: NotificationRepository | null = null;
let running: Promise<void> | null = null;
let pending = false;

/**
 * 予約中の通知を全件計算し直して入れ替える（同時に呼ばれたらまとめて1回やり直す）。
 * 権限がなければ予約しない（OS 側でも表示されないため）。
 */
export async function rescheduleNotifications(): Promise<void> {
  if (running) {
    pending = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        pending = false;
        const permission = await getPermissionState();
        useNotificationSyncStore.setState({ permission });
        const { items } = useSubscriptionStore.getState();
        const plans =
          permission === 'granted'
            ? planNotifications({
                subscriptions: items,
                defaults: useSettingsStore.getState().notificationDefaults,
                isPremium: usePremiumStore.getState().isPremium,
                now: new Date(),
              })
            : [];
        const scheduled = plans.length > 0 ? await replaceScheduled(plans) : [];
        if (plans.length === 0) await cancelAllScheduled();
        await repository?.replaceAll(scheduled);
        useNotificationSyncStore.setState({ scheduledCount: scheduled.length });
      } while (pending);
    } catch (error) {
      logger.error('failed to reschedule notifications', error);
    } finally {
      running = null;
    }
  })();
  return running;
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** 連続した変更（入力中の保存など）をまとめるため少し待ってから入れ替える */
function scheduleSoon() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void rescheduleNotifications();
  }, 300);
}

let unsubscribers: (() => void)[] = [];

/**
 * 起動時に呼ぶ。以後、サブスク・通知の全体設定・プレミアム状態が変わるたびに予約を入れ替える。
 * フォアグラウンド復帰時はサブスクの再読み込み（繰り越し）で一覧が変わるので、ここで追従する。
 */
export async function startNotificationSync(next: NotificationRepository): Promise<void> {
  repository = next;
  ensureSubscribed();
  unsubscribers.forEach((u) => u());
  unsubscribers = [
    useSubscriptionStore.subscribe((state, prev) => {
      if (state.items !== prev.items) scheduleSoon();
    }),
    useSettingsStore.subscribe((state, prev) => {
      if (state.notificationDefaults !== prev.notificationDefaults) scheduleSoon();
    }),
    usePremiumStore.subscribe((state, prev) => {
      if (state.isPremium !== prev.isPremium) scheduleSoon();
    }),
  ];
  await rescheduleNotifications();
}
