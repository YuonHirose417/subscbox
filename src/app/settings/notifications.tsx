import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  Chip,
  FormRow,
  ListRow,
  Screen,
  ScreenHeader,
  Toggle,
} from '@/components/ui';
import { MAX_SCHEDULED_NOTIFICATIONS } from '@/domain/notifications';
import {
  ensureNotificationPermission,
  promptOpenSettings,
} from '@/features/notifications/permission';
import { rescheduleNotifications, useNotificationSyncStore } from '@/features/notifications/sync';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';
import {
  dateToTime,
  NOTIFY_DAY_OPTIONS,
  timeToDate,
} from '@/features/subscriptions/components/NotificationSettingSheet';
import { useTheme } from '@/theme';

/** 通知設定：全体のオン／オフと、既定の何日前・時刻 */
export default function NotificationSettingsScreen() {
  const { spacing, accent, scheme, colors } = useTheme();
  const { isPremium } = usePremium();
  const defaults = useSettingsStore((s) => s.notificationDefaults);
  const setDefaults = useSettingsStore((s) => s.setNotificationDefaults);
  const permission = useNotificationSyncStore((s) => s.permission);
  const scheduledCount = useNotificationSyncStore((s) => s.scheduledCount);

  // 設定アプリで許可を変えて戻ってきたときに表示を更新する
  useEffect(() => {
    void rescheduleNotifications();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void rescheduleNotifications();
    });
    return () => sub.remove();
  }, []);

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title="通知設定" />

      {permission === 'denied' && defaults.enabled ? (
        <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
          <ListRow
            icon="exclamationmark.triangle"
            iconColor={colors.warning}
            title="通知が許可されていません"
            value="設定を開く"
            onPress={promptOpenSettings}
          />
        </Card>
      ) : null}

      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <FormRow label="更新前に通知する" separator={defaults.enabled}>
          <Toggle
            value={defaults.enabled}
            accessibilityLabel="更新前に通知する"
            onValueChange={(enabled) => {
              setDefaults({ ...defaults, enabled });
              if (enabled) void ensureNotificationPermission({ explicit: true });
            }}
          />
        </FormRow>
        {defaults.enabled ? (
          <>
            <FormRow label="何日前に通知するか" stacked separator>
              <View style={[styles.wrap, { gap: spacing.xs }]}>
                {NOTIFY_DAY_OPTIONS.map((d) => (
                  <Chip
                    key={d.days}
                    label={d.label}
                    selected={defaults.daysBefore === d.days}
                    onPress={() => setDefaults({ ...defaults, daysBefore: d.days })}
                  />
                ))}
              </View>
            </FormRow>
            <FormRow label="時刻">
              <DateTimePicker
                value={timeToDate(defaults.time)}
                mode="time"
                display="compact"
                locale="ja-JP"
                accentColor={accent.primary}
                themeVariant={scheme}
                onValueChange={(_e, date) => setDefaults({ ...defaults, time: dateToTime(date) })}
              />
            </FormRow>
          </>
        ) : null}
      </Card>

      <AppText variant="caption" tone="tertiary">
        {isPremium
          ? '新しく登録するサブスクには、この「何日前・時刻」が初期値として使われます。サブスクごとの通知のオン／オフとタイミングは、各サブスクの詳細画面で変えられます。全体の通知をオフにすると、すべてのサブスクの通知が止まります。'
          : 'すべてのサブスクに、この設定が適用されます。サブスクごとに通知のオン／オフやタイミングを変えるには、プレミアムプランが必要です。'}
      </AppText>
      {permission === 'granted' && defaults.enabled ? (
        <AppText variant="caption" tone="tertiary">
          予約中の通知：{scheduledCount}件（近い順に最大{MAX_SCHEDULED_NOTIFICATIONS}
          件まで予約し、アプリを開くたびに入れ替えます）
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
