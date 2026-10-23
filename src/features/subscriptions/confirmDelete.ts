import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

import type { Subscription } from '@/domain/types';
import { logger } from '@/utils/logger';

import { useSubscriptionStore } from './store';

/** 削除の確認アラート →（OK なら）削除。削除したら true */
export function confirmDeleteSubscription(
  sub: Pick<Subscription, 'id' | 'name'>,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(`“${sub.name}”を削除しますか？`, 'この操作は取り消せません', [
      { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await useSubscriptionStore.getState().remove(sub.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            resolve(true);
          } catch (error) {
            logger.error('failed to delete subscription', error);
            Alert.alert('削除できませんでした', 'もう一度お試しください');
            resolve(false);
          }
        },
      },
    ]);
  });
}
