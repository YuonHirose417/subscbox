import * as Notifications from 'expo-notifications';
import { IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationPlan } from '@/domain/notifications';
import { logger } from '@/utils/logger';

export type PermissionState = 'granted' | 'undetermined' | 'denied';

/** Web ではローカル通知を扱わない（対象外プラットフォーム） */
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

/** アプリ表示中に届いた通知もバナーで出す。起動時に1回呼ぶ */
export function configureNotificationHandler(): void {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function toState(status: Notifications.NotificationPermissionsStatus): PermissionState {
  const ios = status.ios?.status;
  if (
    status.granted ||
    ios === IosAuthorizationStatus.PROVISIONAL ||
    ios === IosAuthorizationStatus.EPHEMERAL
  ) {
    return 'granted';
  }
  if (ios === IosAuthorizationStatus.NOT_DETERMINED) return 'undetermined';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

export async function getPermissionState(): Promise<PermissionState> {
  if (!supported) return 'denied';
  try {
    return toState(await Notifications.getPermissionsAsync());
  } catch (error) {
    logger.error('failed to read notification permission', error);
    return 'denied';
  }
}

/** OS の許可ダイアログを出す（未決定のときだけ表示される） */
export async function requestPermission(): Promise<PermissionState> {
  if (!supported) return 'denied';
  try {
    return toState(
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      }),
    );
  } catch (error) {
    logger.error('failed to request notification permission', error);
    return 'denied';
  }
}

export type ScheduledItem = { notificationId: string; subscriptionId: string; fireAt: string };

/** 予約済みの通知をすべて解除し、plans で置き換える。予約できたものを返す */
export async function replaceScheduled(
  plans: readonly NotificationPlan[],
): Promise<ScheduledItem[]> {
  if (!supported) return [];
  await Notifications.cancelAllScheduledNotificationsAsync();
  const scheduled: ScheduledItem[] = [];
  for (const plan of plans) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: plan.title,
          body: plan.body,
          data: { subscriptionId: plan.subscriptionId, renewalDate: plan.renewalDate },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: plan.fireAt },
      });
      scheduled.push({
        notificationId,
        subscriptionId: plan.subscriptionId,
        fireAt: plan.fireAt.toISOString(),
      });
    } catch (error) {
      logger.error('failed to schedule notification', error);
    }
  }
  return scheduled;
}

export async function cancelAllScheduled(): Promise<void> {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** 開発用：OS に予約されている通知の一覧 */
export async function listScheduledForDev(): Promise<
  { id: string; title: string; body: string; fireAt: string | null }[]
> {
  if (!supported) return [];
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  return requests.map((r) => {
    const trigger = r.trigger as { type?: string; value?: number; date?: number } | null;
    const time = trigger && 'value' in trigger ? trigger.value : trigger?.date;
    return {
      id: r.identifier,
      title: r.content.title ?? '',
      body: r.content.body ?? '',
      fireAt: typeof time === 'number' ? new Date(time).toISOString() : null,
    };
  });
}

/** 開発用：指定秒後にテスト通知を出す（タップで詳細画面へ遷移するか確認する） */
export async function scheduleTestNotificationForDev(
  seconds: number,
  subscriptionId: string | null,
): Promise<void> {
  if (!supported) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'テスト通知',
      body: 'SubscBoxのテスト通知です',
      data: subscriptionId ? { subscriptionId } : {},
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
}

/** 通知のタップからサブスク ID を取り出す */
export function subscriptionIdOf(response: Notifications.NotificationResponse): string | null {
  const id = response.notification.request.content.data?.subscriptionId;
  return typeof id === 'string' ? id : null;
}
