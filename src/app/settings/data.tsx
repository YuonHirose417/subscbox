import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';

import { AppText, Card, Icon, ListRow, Screen, ScreenHeader, SectionHeader } from '@/components/ui';
import { summarizeBackup } from '@/domain/backup';
import {
  deleteAllData,
  exportBackup,
  exportCsv,
  pickBackup,
  restoreBackup,
} from '@/features/backup/dataActions';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';
import { useTheme } from '@/theme';
import { logger } from '@/utils/logger';

type Busy = 'export' | 'csv' | 'restore' | 'delete' | null;

function confirm(title: string, message: string, ok: string, destructive = true): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });
}

/** データのバックアップ：書き出し（JSON）・復元・CSV（プレミアム）・外貨レート・全削除 */
export default function DataSettingsScreen() {
  const { spacing, colors } = useTheme();
  const { isPremium } = usePremium();
  const rateCount = Object.keys(useSettingsStore((s) => s.exchangeRates)).length;
  const [busy, setBusy] = useState<Busy>(null);

  const run = async (kind: Exclude<Busy, null>, task: () => Promise<void>, failTitle: string) => {
    if (busy) return;
    setBusy(kind);
    try {
      await task();
    } catch (error) {
      logger.error(`data action failed: ${kind}`, error);
      Alert.alert(failTitle, 'もう一度お試しください。データは変更されていません。');
    } finally {
      setBusy(null);
    }
  };

  const onRestore = () =>
    run(
      'restore',
      async () => {
        const parsed = await pickBackup();
        if (!parsed) return;
        if (!parsed.ok) {
          Alert.alert('このファイルは復元できません', parsed.errors.join('\n'));
          return;
        }
        const ok = await confirm(
          '現在のデータを置き換えますか？',
          `バックアップの内容（${summarizeBackup(parsed.data)}）で、今のデータをすべて上書きします。この操作は取り消せません。`,
          '復元する',
        );
        if (!ok) return;
        await restoreBackup(parsed.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert('復元しました', summarizeBackup(parsed.data));
      },
      '復元できませんでした',
    );

  const onDeleteAll = () =>
    run(
      'delete',
      async () => {
        const first = await confirm(
          'すべてのデータを削除しますか？',
          '登録したサブスク、支払い履歴、支払い方法、自作カテゴリ、外貨レート、設定をすべて削除します。必要なら先に「データを書き出す」でバックアップしてください。',
          '削除に進む',
        );
        if (!first) return;
        const second = await confirm(
          '本当に削除しますか？',
          '削除したデータは元に戻せません。',
          'すべて削除',
        );
        if (!second) return;
        await deleteAllData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert('すべてのデータを削除しました');
      },
      '削除できませんでした',
    );

  const spinner = (kind: Busy) =>
    busy === kind ? <ActivityIndicator color={colors.textSecondary} /> : undefined;
  const lock = isPremium ? undefined : (
    <Icon name="lock.fill" fallback="lock-closed" size={13} color={colors.textTertiary} />
  );

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title="データのバックアップ" />

      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="square.and.arrow.up"
          title="データを書き出す"
          trailing={spinner('export')}
          separator
          onPress={() => run('export', () => exportBackup(), '書き出せませんでした')}
        />
        <ListRow
          icon="square.and.arrow.down"
          title="バックアップから復元"
          trailing={spinner('restore')}
          onPress={onRestore}
        />
      </Card>
      <AppText variant="caption" tone="tertiary">
        書き出したファイル（JSON）は「ファイル」アプリなどに保存できます。機種変更のときは、新しい
        iPhone
        でこのファイルから復元してください。データは端末内だけに保存され、外部には送信されません。
      </AppText>

      <SectionHeader title="CSVで書き出す" />
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="tablecells"
          title="サブスク一覧"
          trailing={spinner('csv') ?? lock}
          separator
          onPress={() =>
            isPremium
              ? run('csv', () => exportCsv('subscriptions'), '書き出せませんでした')
              : router.push('/paywall')
          }
        />
        <ListRow
          icon="list.bullet.rectangle"
          title="支払い履歴"
          trailing={lock}
          onPress={() =>
            isPremium
              ? run('csv', () => exportCsv('payments'), '書き出せませんでした')
              : router.push('/paywall')
          }
        />
      </Card>
      <AppText variant="caption" tone="tertiary">
        Excel・Numbers で開ける形式（UTF-8）です。CSVからは復元できません。
        {isPremium ? '' : 'CSVの書き出しはプレミアムプランの機能です。'}
      </AppText>

      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="yensign.circle"
          title="外貨の為替レート"
          value={rateCount > 0 ? `${rateCount}通貨` : '未設定'}
          onPress={() => router.push('/settings/currency')}
        />
      </Card>

      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="trash"
          title="すべてのデータを削除"
          destructive
          showChevron={false}
          trailing={spinner('delete')}
          onPress={onDeleteAll}
        />
      </Card>
    </Screen>
  );
}
