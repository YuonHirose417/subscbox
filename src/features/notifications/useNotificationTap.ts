import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { subscriptionIdOf } from '@/services/notifications';

const handled = new Set<string>();

function open(response: Notifications.NotificationResponse) {
  const key = response.notification.request.identifier + response.notification.date;
  if (handled.has(key)) return;
  handled.add(key);
  const id = subscriptionIdOf(response);
  if (id) router.push({ pathname: '/subscription/[id]', params: { id } });
}

/** 通知のタップで該当サブスクの詳細画面を開く（起動前のタップも含む）。ready になってから有効 */
export function useNotificationTap(ready: boolean): void {
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    // アプリが終了していた状態でタップされた通知
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) open(response);
      })
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [ready]);
}
