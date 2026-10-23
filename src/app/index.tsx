import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Card,
  CountUpText,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  PressableScale,
  Screen,
  SegmentedControl,
  Skeleton,
} from '@/components/ui';
import { formatMoney } from '@/domain/money';
import type { Period } from '@/domain/types';
import { useSettingsStore } from '@/features/settings/store';
import { CategoryDonut } from '@/features/subscriptions/components/CategoryDonut';
import { SummaryCards } from '@/features/subscriptions/components/SummaryCards';
import { UpcomingRenewals } from '@/features/subscriptions/components/UpcomingRenewals';
import { useSpendingSummary } from '@/features/subscriptions/hooks/useSpendingSummary';
import { useToday } from '@/features/subscriptions/hooks/useToday';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

const PERIODS = [
  { value: 'month', label: ja.period.month },
  { value: 'year', label: ja.period.year },
  { value: 'all', label: ja.period.all },
] as const;

const FAB_SIZE = 56;

export default function HomeScreen() {
  const { spacing, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('month');
  const status = useSubscriptionStore((s) => s.status);
  const load = useSubscriptionStore((s) => s.load);
  const summary = useSpendingSummary(period);
  const rates = useSettingsStore((s) => s.exchangeRates);
  const today = useToday();
  const t = ja.screens.home;

  const openAdd = () => router.push('/add');
  const isEmpty = status === 'ready' && summary.activeCount === 0;
  const diff = Math.round(summary.monthOverMonth);
  const diffColor = diff > 0 ? colors.negative : diff < 0 ? colors.positive : colors.textSecondary;

  return (
    <View style={styles.root}>
      <Screen tint contentStyle={{ paddingBottom: insets.bottom + FAB_SIZE + spacing.xxl }}>
        <View style={styles.header}>
          <AppText variant="title" accessibilityRole="header" style={styles.headerTitle}>
            {t.titleLine1}
            {'\n'}
            {t.titleLine2}
          </AppText>
          <IconButton
            icon="gearshape"
            fallback="settings-outline"
            accessibilityLabel={ja.screens.settings.title}
            onPress={() => router.push('/settings')}
          />
        </View>

        {status === 'error' ? (
          <ErrorState onRetry={load} />
        ) : status !== 'ready' ? (
          <HomeSkeleton />
        ) : isEmpty ? (
          <Card>
            <EmptyState
              icon="tray"
              title={ja.empty.homeTitle}
              description={ja.empty.homeBody}
              actionLabel={ja.empty.homeAction}
              onAction={openAdd}
            />
          </Card>
        ) : (
          <>
            <View style={{ gap: spacing.xxs }}>
              <CountUpText
                value={summary.monthlyTotal}
                format={(v) => formatMoney(v)}
                variant="display"
                numberOfLines={1}
                adjustsFontSizeToFit
              />
              <View
                style={[styles.diff, { gap: spacing.xxs }]}
                accessible
                accessibilityLabel={`先月比 ${formatMoney(diff, 'JPY', { signed: true })}`}>
                {diff !== 0 ? (
                  <Icon
                    name={diff > 0 ? 'arrow.up' : 'arrow.down'}
                    fallback={diff > 0 ? 'arrow-up' : 'arrow-down'}
                    size={13}
                    weight="semibold"
                    color={diffColor}
                  />
                ) : null}
                <AppText variant="footnote" style={{ color: diffColor, fontWeight: '500' }}>
                  {formatMoney(diff, 'JPY', { signed: true })}
                </AppText>
                <AppText variant="footnote" tone="secondary">
                  （先月比）
                </AppText>
              </View>
              {summary.missingRateCurrencies.length > 0 ? (
                <AppText
                  variant="caption"
                  accessibilityRole="link"
                  onPress={() => router.push('/settings/currency')}
                  style={{ color: colors.warning }}>
                  レート未設定の外貨があります（{summary.missingRateCurrencies.join('・')}）›
                </AppText>
              ) : null}
            </View>

            <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

            <PressableScale
              accessibilityRole="button"
              accessibilityHint="支出の分析を開きます"
              onPress={() => router.push('/analytics')}
              scaleTo={0.99}
              style={{ paddingVertical: spacing.xs }}>
              <CategoryDonut breakdown={summary.breakdown} period={period} />
            </PressableScale>

            <SummaryCards
              activeCount={summary.activeCount}
              yearlyForecast={summary.yearlyForecast}
            />

            <UpcomingRenewals
              items={summary.upcoming}
              today={today}
              rates={rates}
              onPressItem={(sub) =>
                router.push({ pathname: '/subscription/[id]', params: { id: sub.id } })
              }
            />
          </>
        )}
      </Screen>

      {!isEmpty ? (
        <IconButton
          icon="plus"
          fallback="add"
          variant="gradient"
          size={FAB_SIZE}
          accessibilityLabel="サブスクを追加"
          onPress={openAdd}
          style={[styles.fab, { bottom: insets.bottom + spacing.xs }]}
        />
      ) : null}
    </View>
  );
}

function HomeSkeleton() {
  const { spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Skeleton width="60%" height={44} />
      <Skeleton width="35%" height={14} />
      <Skeleton height={38} radius={radius.pill} />
      <View style={[styles.diff, { gap: spacing.lg }]}>
        <Skeleton width={150} height={150} radius={75} />
        <View style={{ flex: 1, gap: spacing.sm }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={12} />
          ))}
        </View>
      </View>
      <Skeleton height={120} radius={radius.card} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 8 },
  headerTitle: { flex: 1, lineHeight: 30 },
  diff: { flexDirection: 'row', alignItems: 'center' },
  fab: { position: 'absolute', alignSelf: 'center' },
});
