import { Alert, Linking } from 'react-native';

import { getPermissionState, requestPermission } from '@/services/notifications';

import { rescheduleNotifications } from './sync';

function ask(title: string, message: string, ok: string, cancel = 'あとで'): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: ok, onPress: () => resolve(true) },
    ]);
  });
}

/** 設定アプリで通知を許可してもらう案内 */
export async function promptOpenSettings(): Promise<void> {
  const open = await ask(
    '通知がオフになっています',
    '更新日の前にお知らせするには、設定アプリで「SubscBox」の通知を許可してください。',
    '設定を開く',
  );
  if (open) await Linking.openSettings();
}

/**
 * 通知をオンにして保存したときに呼ぶ。まだ許可を尋ねていなければ理由を説明してから OS のダイアログを出す
 * （アプリ起動直後には尋ねない）。すでに拒否されている場合、explicit のときだけ設定アプリへ案内する。
 */
export async function ensureNotificationPermission(
  options: { explicit?: boolean } = {},
): Promise<boolean> {
  const state = await getPermissionState();
  if (state === 'granted') return true;
  if (state === 'denied') {
    if (options.explicit) await promptOpenSettings();
    return false;
  }
  const proceed = await ask(
    '更新前に通知しますか？',
    '次回更新日の前に「Netflix（¥1,590）が3日後に更新されます」のようにお知らせします。続けて表示される画面で通知を許可してください。',
    '続ける',
  );
  if (!proceed) return false;
  const result = await requestPermission();
  await rescheduleNotifications();
  return result === 'granted';
}
