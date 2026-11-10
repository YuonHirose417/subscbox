import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Card,
  EmptyState,
  FormRow,
  Icon,
  ListRow,
  Screen,
  ScreenHeader,
  Toggle,
  type IconName,
} from '@/components/ui';
import { cycleSuffix, daysUntil, monthlyEquivalent } from '@/domain/billing';
import {
  dateOfDateTime,
  diffDays,
  formatDaysLeft,
  formatFullDate,
  formatMonthDay,
} from '@/domain/dates';
import { formatMinor, formatMoney, fromMinor } from '@/domain/money';
import { effectiveNotification } from '@/domain/notifications';
import { formatPaymentMethod } from '@/domain/paymentMethod';
import type {
  BillingCycle,
  NotificationSetting,
  Subscription,
  SubscriptionInput,
} from '@/domain/types';
import { useCategories } from '@/features/categories/store';
import { ensureNotificationPermission } from '@/features/notifications/permission';
import { usePaymentMethodStore } from '@/features/paymentMethods/store';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';
import { DetailHeader } from '@/features/subscriptions/components/DetailHeader';
import { LastUsedSheet } from '@/features/subscriptions/components/LastUsedSheet';
import {
  NotificationSettingSheet,
  notifyDaysLabel,
} from '@/features/subscriptions/components/NotificationSettingSheet';
import { confirmDeleteSubscription } from '@/features/subscriptions/confirmDelete';
import { CategoryPickerSheet } from '@/features/subscriptions/form/CategoryPickerSheet';
import { PaymentMethodPickerSheet } from '@/features/subscriptions/form/PaymentMethodPickerSheet';
import { useToday } from '@/features/subscriptions/hooks/useToday';
import { renewalBadgeTone } from '@/features/subscriptions/renewalBadge';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { useTheme, withAlpha } from '@/theme';
import { isAppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import {
  openPaywall,
  reachedSubscriptionLimit,
  SUBSCRIPTION_LIMIT_REASON,
} from '@/features/premium/gate';

/** 「月額料金」「年額料金」「週額料金」「料金（3か月ごと）」 */
function priceLabel(cycle: BillingCycle): string {
  if (cycle.interval === 1)
    return { week: '週額料金', month: '月額料金', year: '年額料金' }[cycle.unit];
  return `料金（${cycleSuffix(cycle).slice(1)}ごと）`;
}

function lastUsedAgo(date: string, today: string): string {
  const days = diffDays(date, today);
  return days === 0 ? '今日' : `${days}日前`;
}

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sub = useSubscriptionStore((s) => s.items.find((item) => item.id === id));

  if (!sub) {
    return (
      <Screen>
        <ScreenHeader showBack title="" />
        <EmptyState
          icon="questionmark.folder"
          title="サブスクが見つかりませんでした"
          description="削除された可能性があります"
          actionLabel="戻る"
          onAction={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </Screen>
    );
  }
  return <Detail sub={sub} />;
}

function Detail({ sub }: { sub: Subscription }) {
  const theme = useTheme();
  const { spacing, colors, accent } = theme;
  const insets = useSafeAreaInsets();
  const today = useToday();
  const categories = useCategories();
  const paymentMethods = usePaymentMethodStore((s) => s.items);
  const notificationDefaults = useSettingsStore((s) => s.notificationDefaults);
  const { isPremium } = usePremium();
  const store = useSubscriptionStore.getState;
  const [sheet, setSheet] = useState<'category' | 'payment' | 'notification' | 'lastUsed' | null>(
    null,
  );

  const category = categories.find((c) => c.id === sub.categoryId);
  const paymentMethod = paymentMethods.find((m) => m.id === sub.paymentMethodId);
  const cancelled = sub.status === 'cancelled';
  const daysLeft = daysUntil(sub.nextRenewalDate, today);
  const tone = renewalBadgeTone(daysLeft);
  const renewalColor = {
    negative: colors.negativeText,
    positive: colors.positiveText,
    info: colors.infoText,
    warning: colors.warningText,
    neutral: colors.textSecondary,
  }[tone];
  // 無料版は全体設定に従う（サブスクごとの通知設定はプレミアム）。全体設定のオフはすべてに優先する
  const notification: NotificationSetting = effectiveNotification(
    sub,
    notificationDefaults,
    isPremium,
  );
  const globalOff = !notificationDefaults.enabled;

  const save = async (patch: Partial<SubscriptionInput>) => {
    try {
      await store().update(sub.id, patch);
    } catch (error) {
      logger.error('failed to update subscription', error);
      Alert.alert(
        '保存できませんでした',
        isAppError(error) && error.code === 'VALIDATION' ? error.message : 'もう一度お試しください',
      );
    }
  };

  const explainGlobalOff = () =>
    Alert.alert(
      '通知の全体設定がオフです',
      '設定 → 通知設定 で「更新前に通知する」をオンにすると、サブスクごとの通知が届きます。',
      [
        { text: '閉じる', style: 'cancel' },
        { text: '通知設定を開く', onPress: () => router.push('/settings/notifications') },
      ],
    );

  const requirePremium = () =>
    openPaywall(
      `無料版では、すべてのサブスクに通知の全体設定（${notifyDaysLabel(notificationDefaults.daysBefore)} ${notificationDefaults.time}）が適用されます。サブスクごとの設定はプレミアムプランで利用できます。`,
    );

  const duplicate = async () => {
    if (reachedSubscriptionLimit(useSubscriptionStore.getState().items, isPremium)) {
      openPaywall(SUBSCRIPTION_LIMIT_REASON);
      return;
    }
    try {
      const copy = await store().duplicate(sub.id);
      router.replace({ pathname: '/subscription/[id]', params: { id: copy.id } });
    } catch (error) {
      logger.error('failed to duplicate subscription', error);
      Alert.alert('複製できませんでした', 'もう一度お試しください');
    }
  };

  const onMenuAction = (action: string) => {
    if (action === 'cancel') {
      Alert.alert(
        `“${sub.name}”を解約済みにしますか？`,
        '解約済みのサブスクは一覧・合計から外れ、支出の推移には履歴として残ります。',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '解約済みにする',
            style: 'destructive',
            onPress: () =>
              store()
                .cancel(sub.id)
                .catch((e) => logger.error('cancel failed', e)),
          },
        ],
      );
    } else if (action === 'reactivate') {
      if (reachedSubscriptionLimit(useSubscriptionStore.getState().items, isPremium)) {
        openPaywall(SUBSCRIPTION_LIMIT_REASON);
        return;
      }
      store()
        .reactivate(sub.id)
        .catch((e) => logger.error('reactivate failed', e));
    } else if (action === 'edit') {
      router.push({ pathname: '/subscription/[id]/edit', params: { id: sub.id } });
    }
  };

  const isMonthly = sub.cycle.unit === 'month' && sub.cycle.interval === 1;
  const monthly = monthlyEquivalent(fromMinor(sub.amountMinor, sub.currency), sub.cycle);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        <DetailHeader
          subscription={sub}
          menuActions={[
            { id: 'edit', title: '編集' },
            cancelled
              ? { id: 'reactivate', title: '契約中に戻す' }
              : { id: 'cancel', title: '解約済みにする', destructive: true },
          ]}
          onMenuAction={onMenuAction}
        />

        <View
          style={{ gap: spacing.md, paddingHorizontal: spacing.screen, marginTop: -spacing.xxxl }}>
          {/* 情報カード */}
          <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
            <FormRow label={priceLabel(sub.cycle)} separator>
              <AppText variant="callout" style={styles.right}>
                {formatMinor(sub.amountMinor, sub.currency)}
              </AppText>
              {!isMonthly || sub.currency !== 'JPY' ? (
                <AppText variant="caption" tone="secondary" style={styles.right}>
                  月額換算 {formatMoney(monthly, sub.currency)}
                </AppText>
              ) : null}
            </FormRow>
            <FormRow label={cancelled ? '解約日' : '更新日'} separator>
              {cancelled && sub.cancelledAt ? (
                <AppText variant="body" tone="secondary" style={styles.right}>
                  {formatFullDate(dateOfDateTime(sub.cancelledAt))}
                </AppText>
              ) : (
                <AppText variant="body" style={[styles.right, { color: renewalColor }]}>
                  {formatFullDate(sub.nextRenewalDate)}
                  {'\n'}（{formatDaysLeft(daysLeft)}）
                </AppText>
              )}
            </FormRow>
            <FormRow label="支払い方法" separator onPress={() => setSheet('payment')}>
              <AppText
                variant="body"
                tone={paymentMethod ? 'primary' : 'tertiary'}
                numberOfLines={1}>
                {paymentMethod ? formatPaymentMethod(paymentMethod) : '未設定'}
              </AppText>
            </FormRow>
            <FormRow label="カテゴリ" onPress={() => setSheet('category')}>
              <View style={[styles.inline, { gap: spacing.xs }]}>
                {category ? (
                  <View
                    style={[styles.catIcon, { backgroundColor: withAlpha(category.color, 0.16) }]}>
                    <Icon
                      name={category.icon as IconName}
                      fallback="pricetag"
                      size={13}
                      color={category.color}
                    />
                  </View>
                ) : null}
                <AppText variant="body" numberOfLines={1}>
                  {category?.name ?? '未分類'}
                </AppText>
              </View>
            </FormRow>
          </Card>

          {/* 通知カード */}
          <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
            <ListRow
              icon="bell"
              iconBackground={withAlpha(accent.secondary, 0.12)}
              iconColor={accent.secondary}
              title="更新前に通知する"
              showChevron={false}
              onPress={
                globalOff
                  ? explainGlobalOff
                  : isPremium
                    ? () => setSheet('notification')
                    : requirePremium
              }
              accessibilityLabel={`更新前に通知する、${notification.enabled ? `${notifyDaysLabel(notification.daysBefore)} ${notification.time}` : 'オフ'}`}
              trailing={
                <View style={[styles.inline, { gap: spacing.xs }]}>
                  {notification.enabled ? (
                    <AppText variant="caption" tone="secondary">
                      {notifyDaysLabel(notification.daysBefore)} {notification.time}
                    </AppText>
                  ) : null}
                  {isPremium ? null : (
                    <Icon
                      name="lock.fill"
                      fallback="lock-closed"
                      size={12}
                      color={colors.textTertiary}
                    />
                  )}
                  <Toggle
                    value={notification.enabled}
                    disabled={!isPremium || cancelled || globalOff}
                    accessibilityLabel="更新前に通知する"
                    onValueChange={async (enabled) => {
                      await save({ notification: { ...sub.notification, enabled } });
                      if (enabled) await ensureNotificationPermission({ explicit: true });
                    }}
                  />
                </View>
              }
            />
          </Card>

          {/* アクションカード */}
          <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
            <ListRow
              icon="square.and.pencil"
              iconBackground={withAlpha(colors.info, 0.12)}
              iconColor={colors.info}
              title="編集"
              separator
              onPress={() =>
                router.push({ pathname: '/subscription/[id]/edit', params: { id: sub.id } })
              }
            />
            <ListRow
              icon="plus.square.on.square"
              iconBackground={withAlpha(colors.positive, 0.12)}
              iconColor={colors.positive}
              title="複製"
              separator
              onPress={duplicate}
            />
            <ListRow
              icon="trash"
              iconBackground={colors.negativeSoft}
              title="削除"
              destructive
              showChevron={false}
              onPress={async () => {
                if (await confirmDeleteSubscription(sub)) router.back();
              }}
            />
          </Card>
          {/* カンプにない追加要素：最終利用日（見直し候補用）・支払い履歴（プレミアム） */}
          <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
            <ListRow
              icon="hourglass"
              iconBackground={withAlpha(colors.warning, 0.14)}
              iconColor={colors.warning}
              title="最終利用日"
              value={
                sub.lastUsedDate
                  ? `${formatMonthDay(sub.lastUsedDate)}（${lastUsedAgo(sub.lastUsedDate, today)}）`
                  : '未記録'
              }
              separator
              onPress={() => setSheet('lastUsed')}
            />
            <ListRow
              icon="clock.arrow.circlepath"
              iconBackground={withAlpha(accent.tertiary, 0.14)}
              iconColor={accent.tertiary}
              title="支払い履歴"
              trailing={
                isPremium ? null : (
                  <Icon
                    name="lock.fill"
                    fallback="lock-closed"
                    size={12}
                    color={colors.textTertiary}
                  />
                )
              }
              onPress={() =>
                isPremium
                  ? router.push({ pathname: '/subscription/[id]/payments', params: { id: sub.id } })
                  : openPaywall('過去の支払い履歴の確認・修正は、プレミアムプランで利用できます。')
              }
            />
          </Card>
          {cancelled ? (
            <AppText variant="caption" tone="tertiary" style={styles.center}>
              このサブスクは解約済みです。右上の「…」から契約中に戻せます。
            </AppText>
          ) : null}
        </View>
      </ScrollView>

      <CategoryPickerSheet
        visible={sheet === 'category'}
        value={sub.categoryId}
        onSelect={(categoryId) => save({ categoryId })}
        onClose={() => setSheet(null)}
      />
      <PaymentMethodPickerSheet
        visible={sheet === 'payment'}
        value={sub.paymentMethodId}
        onSelect={(paymentMethodId) => save({ paymentMethodId })}
        onClose={() => setSheet(null)}
      />
      <LastUsedSheet
        visible={sheet === 'lastUsed'}
        value={sub.lastUsedDate}
        today={today}
        onSave={(lastUsedDate) => save({ lastUsedDate })}
        onClose={() => setSheet(null)}
      />
      <NotificationSettingSheet
        visible={sheet === 'notification'}
        value={sub.notification}
        onChange={(value) => save({ notification: value })}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  right: { textAlign: 'right' },
  inline: { flexDirection: 'row', alignItems: 'center' },
  catIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
});
