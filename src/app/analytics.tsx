import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { BarChart } from '@/components/charts/BarChart';
import {
  AppText,
  Badge,
  Card,
  EmptyState,
  Icon,
  ListRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  SegmentedControl,
} from '@/components/ui';
import { compareDate, formatMonthDay } from '@/domain/dates';
import { formatMinor, formatMoney } from '@/domain/money';
import type { TrendPoint } from '@/domain/trend';
import type { Period } from '@/domain/types';
import { BreakdownSheet } from '@/features/analytics/components/BreakdownSheet';
import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { usePremium } from '@/features/premium/usePremium';
import { CategoryDonut } from '@/features/subscriptions/components/CategoryDonut';
import { ServiceIcon } from '@/features/subscriptions/components/ServiceIcon';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

const PERIODS = [
  { value: 'month', label: ja.period.month },
  { value: 'year', label: ja.period.year },
  { value: 'all', label: ja.period.all },
] as const;

const CENTER_LABEL: Record<Period, string> = { month: '月額', year: '年間', all: '累計' };

export default function AnalyticsScreen() {
  const { spacing, colors, sizes, accent } = useTheme();
  const { isPremium } = usePremium();
  const [period, setPeriod] = useState<Period>('month');
  const [categoryPeriod, setCategoryPeriod] = useState<Period>('year');
  const [selected, setSelected] = useState<TrendPoint | null>(null);
  const a = useAnalytics(period, categoryPeriod);

  const trendTitle = a.trend[0]?.key.length === 4 ? '年別の支出推移' : '月別の支出推移';
  const billsTotal = a.bills.reduce((s, e) => s + (e.amountJpy ?? 0), 0);

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title={ja.screens.analytics.title} />
      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

      {a.missingRateCurrencies.length > 0 ? (
        <ListRow
          icon="exclamationmark.triangle"
          iconColor={colors.warning}
          title={`レート未設定の外貨があります（${a.missingRateCurrencies.join('・')}）`}
          onPress={() => router.push('/settings/currency')}
        />
      ) : null}

      {/* 月別の支出推移 */}
      <Card style={{ gap: spacing.sm }}>
        <SectionHeader
          title={trendTitle}
          trailing={a.hasData ? `平均 ${formatMoney(a.average)}` : undefined}
        />
        {a.hasData ? (
          <BarChart
            key={`${period}-${a.trend.length}`}
            bars={a.trend.map((p) => ({ key: p.key, label: p.label, value: p.total }))}
            highlightIndex={a.trend.length - 1}
            formatValue={(v) => formatMoney(v)}
            onPressBar={(i) => setSelected(a.trend[i])}
          />
        ) : (
          <EmptyState icon="chart.bar" title={ja.empty.analyticsTitle} />
        )}
      </Card>

      {/* カテゴリ別の支出（カンプ2画面目） */}
      <AppText variant="title" accessibilityRole="header" style={{ marginTop: spacing.xs }}>
        カテゴリ別の支出
      </AppText>
      <SegmentedControl options={PERIODS} value={categoryPeriod} onChange={setCategoryPeriod} />
      <View style={{ paddingVertical: spacing.xs }}>
        <CategoryDonut
          breakdown={a.breakdown}
          period={categoryPeriod}
          legendValue="ratio"
          centerLabel={CENTER_LABEL[categoryPeriod]}
          showSuffix={false}
          size={160}
        />
      </View>

      {/* ここから下はカンプにない追加セクション */}
      <Card style={{ gap: spacing.sm }}>
        <SectionHeader title="支出ランキング" />
        {a.ranking.length === 0 ? (
          <AppText variant="footnote" tone="secondary">
            登録中のサブスクはありません
          </AppText>
        ) : (
          a.ranking.map((r, i) => (
            <View
              key={r.subscription.id}
              accessible
              accessibilityLabel={`${i + 1}位 ${r.subscription.name}、${formatMoney(r.amount)}、全体の${Math.round(r.ratio * 100)}パーセント`}
              style={[styles.row, { gap: spacing.sm }]}>
              <AppText variant="callout" tone="secondary" style={styles.rank}>
                {i + 1}
              </AppText>
              <ServiceIcon subscription={r.subscription} size={36} />
              <View style={[styles.flex, { gap: spacing.xxs }]}>
                <View style={styles.row}>
                  <AppText variant="body" numberOfLines={1} style={styles.flex}>
                    {r.subscription.name}
                  </AppText>
                  <AppText variant="callout">{formatMoney(r.amount)}</AppText>
                </View>
                <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.max(2, r.ratio * 100)}%`, backgroundColor: accent.primary },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </Card>

      <Card style={{ gap: spacing.xs }}>
        <SectionHeader title="年間支出予測" />
        <AppText variant="title" style={styles.amount}>
          {formatMoney(a.forecast)}
        </AppText>
        <AppText variant="caption" tone="secondary">
          今日から1年間に実際に請求される見込み額（請求日ベース）です。月額換算×12（
          {formatMoney(a.monthlyTimes12)}）とは、年払いの請求月などにより差が出ます。
        </AppText>
      </Card>

      <Card padding={0} style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <SectionHeader title="今月の請求予定" trailing={`合計 ${formatMoney(billsTotal)}`} />
        {a.bills.length === 0 ? (
          <AppText variant="footnote" tone="secondary" style={{ paddingVertical: spacing.md }}>
            今月の請求予定はありません
          </AppText>
        ) : (
          a.bills.map((e, index) => {
            const done = compareDate(e.date, a.today) < 0;
            return (
              <View
                key={`${e.subscription.id}-${e.date}`}
                accessible
                accessibilityLabel={`${formatMonthDay(e.date)}、${e.subscription.name}、${formatMinor(e.amountMinor, e.currency)}${done ? '、請求済み' : ''}`}
                style={[styles.row, { gap: spacing.sm, paddingVertical: spacing.sm }]}>
                <AppText variant="footnote" tone="secondary" style={styles.date}>
                  {formatMonthDay(e.date)}
                </AppText>
                <ServiceIcon subscription={e.subscription} size={32} />
                <AppText variant="body" numberOfLines={1} style={styles.flex}>
                  {e.subscription.name}
                </AppText>
                {done ? <Badge label="請求済み" tone="neutral" /> : null}
                <AppText variant="callout">{formatMinor(e.amountMinor, e.currency)}</AppText>
                {index < a.bills.length - 1 ? (
                  <View
                    style={[
                      styles.separator,
                      { height: sizes.hairline, backgroundColor: colors.hairline },
                    ]}
                  />
                ) : null}
              </View>
            );
          })
        )}
      </Card>

      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="calendar"
          title="支払いカレンダー"
          trailing={
            isPremium ? null : (
              <Icon name="lock.fill" fallback="lock-closed" size={12} color={colors.textTertiary} />
            )
          }
          onPress={() =>
            isPremium
              ? router.push('/calendar')
              : Alert.alert(
                  'プレミアムプランの機能です',
                  'カレンダーで支払い履歴を確認できるのは、プレミアムプランの機能です。',
                )
          }
        />
      </Card>

      <BreakdownSheet point={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  rank: { width: 18, textAlign: 'center' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  amount: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  date: { width: 52 },
  separator: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
