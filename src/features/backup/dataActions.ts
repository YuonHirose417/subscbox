import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getRepositories } from '@/db';
import { createBackup, parseBackup, type BackupData, type ParseResult } from '@/domain/backup';
import { paymentsCsv, subscriptionsCsv } from '@/domain/csv';
import { toDateString } from '@/domain/dates';
import { useCategoryStore } from '@/features/categories/store';
import { rescheduleNotifications } from '@/features/notifications/sync';
import { usePaymentMethodStore } from '@/features/paymentMethods/store';
import { usePaymentStore } from '@/features/payments/store';
import { hydrateSettings, useSettingsStore } from '@/features/settings/store';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { cancelAllScheduled } from '@/services/notifications';

function stamp(now: Date): string {
  return toDateString(now).replace(/-/g, '');
}

/** 一時ファイルに書いて共有シートを開く（保存先はユーザーが選ぶ） */
async function shareText(
  name: string,
  content: string,
  type: { mimeType: string; UTI: string },
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('この端末では共有できません');
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(content);
  try {
    await Sharing.shareAsync(file.uri, { ...type, dialogTitle: name });
  } finally {
    // 共有後は一時ファイルを残さない
    try {
      file.delete();
    } catch {
      // 共有先がまだ読んでいる等で消せなくても問題ない（キャッシュは OS が整理する）
    }
  }
}

/** すべてのデータを JSON で書き出す */
export async function exportBackup(now = new Date()): Promise<void> {
  const data = await getRepositories().dataTransfer.exportAll();
  const json = JSON.stringify(createBackup(data, now), null, 2);
  await shareText(`subscbox-backup-${stamp(now)}.json`, json, {
    mimeType: 'application/json',
    UTI: 'public.json',
  });
}

/** サブスク一覧・支払い履歴を CSV で書き出す（プレミアム） */
export async function exportCsv(
  kind: 'subscriptions' | 'payments',
  now = new Date(),
): Promise<void> {
  const subs = useSubscriptionStore.getState().items;
  const content =
    kind === 'subscriptions'
      ? subscriptionsCsv(
          subs,
          useCategoryStore.getState().items,
          usePaymentMethodStore.getState().items,
          useSettingsStore.getState().exchangeRates,
        )
      : paymentsCsv(usePaymentStore.getState().items, subs);
  const name = kind === 'subscriptions' ? 'subscriptions' : 'payments';
  await shareText(`subscbox-${name}-${stamp(now)}.csv`, content, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });
}

/** ファイルを選んで検証する。キャンセルなら null */
export async function pickBackup(): Promise<ParseResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'public.json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const file = new File(result.assets[0].uri);
  try {
    return parseBackup(await file.text());
  } finally {
    try {
      file.delete();
    } catch {
      // 一時コピーが消せなくても問題ない
    }
  }
}

/** DB から全ストアを読み直す（支払い履歴と通知はサブスクの変化を受けて追従する） */
async function reloadAll(): Promise<void> {
  const repos = getRepositories();
  await hydrateSettings(repos.settings);
  await Promise.all([useCategoryStore.getState().load(), usePaymentMethodStore.getState().load()]);
  await useSubscriptionStore.getState().load();
  await usePaymentStore.getState().load();
  await rescheduleNotifications();
}

/** 検証済みのバックアップで現在のデータを置き換える（失敗時は DB をロールバックし、元のまま） */
export async function restoreBackup(data: BackupData): Promise<void> {
  await getRepositories().dataTransfer.replaceAll(data);
  await reloadAll();
}

/** すべてのデータを削除して初期状態に戻す */
export async function deleteAllData(): Promise<void> {
  await cancelAllScheduled();
  await getRepositories().dataTransfer.deleteAll();
  await reloadAll();
}
