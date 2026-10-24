import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { getRepositories } from '@/db';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { listScheduledForDev, scheduleTestNotificationForDev } from '@/services/notifications';
import { useTheme } from '@/theme';

import { ensureNotificationPermission } from './permission';
import { rescheduleNotifications } from './sync';

type Row = { id: string; text: string };

/** 開発用：1分後のテスト通知と、予約中の通知一覧 */
export function DevNotificationTools() {
  const { spacing } = useTheme();
  const [rows, setRows] = useState<Row[] | null>(null);

  const test = async () => {
    if (!(await ensureNotificationPermission({ explicit: true }))) return;
    const first = useSubscriptionStore.getState().items.find((s) => s.status === 'active');
    await scheduleTestNotificationForDev(60, first?.id ?? null);
    Alert.alert(
      '1分後に通知します',
      first ? `タップすると「${first.name}」の詳細を開きます。アプリを閉じて待ってください。` : '',
    );
  };

  const list = async () => {
    await rescheduleNotifications();
    const [os, table] = await Promise.all([
      listScheduledForDev(),
      getRepositories().notifications.list(),
    ]);
    const fireAtById = new Map(table.map((t) => [t.notificationId, t.fireAt]));
    setRows(
      os
        .map((n) => ({ ...n, fireAt: n.fireAt ?? fireAtById.get(n.id) ?? null }))
        .sort((a, b) => (a.fireAt ?? '').localeCompare(b.fireAt ?? ''))
        .map((n) => ({
          id: n.id,
          text: `${n.fireAt ? new Date(n.fireAt).toLocaleString('ja-JP') : '日時不明'}  ${n.body}`,
        })),
    );
  };

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <Button
          title="1分後にテスト通知"
          size="sm"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={test}
        />
        <Button
          title="予約中の通知一覧"
          size="sm"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={list}
        />
      </View>
      {rows ? (
        <>
          <AppText variant="footnote" tone="secondary">
            OS に予約中：{rows.length}件
          </AppText>
          {rows.map((r) => (
            <AppText key={r.id} variant="caption" tone="secondary">
              {r.text}
            </AppText>
          ))}
        </>
      ) : null}
    </View>
  );
}
