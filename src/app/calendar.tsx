import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  IconButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import {
  addDays,
  addMonthsTo,
  compareDate,
  endOfMonth,
  formatMonthDay,
  parseDate,
  startOfMonth,
} from '@/domain/dates';
import { formatMinor, formatMoney, fromMinor, toJpy } from '@/domain/money';
import { visiblePayments } from '@/domain/payments';
import { billingEvents } from '@/domain/trend';
import type { CurrencyCode, DateString, Subscription } from '@/domain/types';
import { useCategories } from '@/features/categories/store';
import { usePayments } from '@/features/payments/usePayments';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';
import { ServiceIcon } from '@/features/subscriptions/components/ServiceIcon';
import { useToday } from '@/features/subscriptions/hooks/useToday';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { useTheme } from '@/theme';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

type DayEntry = {
  subscription: Subscription;
  date: DateString;
  amountMinor: number;
  currency: CurrencyCode;
  /** paid=支払い履歴（過去）、planned=請求予定（未来） */
  kind: 'paid' | 'planned';
};

/** 支払いカレンダー（プレミアム）：月表示で支払日に印を付け、タップでその日の内訳 */
export default function CalendarScreen() {
  const { spacing, colors, accent, radius } = useTheme();
  const { isPremium } = usePremium();
  const today = useToday();
  const subs = useSubscriptionStore((s) => s.items);
  const priceHistory = useSubscriptionStore((s) => s.priceHistory);
  const rates = useSettingsStore((s) => s.exchangeRates);
  const categories = useCategories();
  const payments = usePayments();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selected, setSelected] = useState<DateString>(today);

  const entries = useMemo(() => {
    const from = month;
    const to = endOfMonth(month);
    const byId = new Map(subs.map((s) => [s.id, s]));
    const list: DayEntry[] = [];
    for (const p of visiblePayments(payments)) {
      const sub = byId.get(p.subscriptionId);
      if (!sub || compareDate(p.billedOn, from) < 0 || compareDate(p.billedOn, to) > 0) continue;
      list.push({
        subscription: sub,
        date: p.billedOn,
        amountMinor: p.amountMinor,
        currency: p.currency,
        kind: 'paid',
      });
    }
    // 今日より後は請求予定として表示する（支払い履歴は今日までしか作らない）
    const futureFrom = compareDate(today, from) >= 0 ? addDays(today, 1) : from;
    for (const e of billingEvents(
      subs.filter((s) => s.status === 'active'),
      priceHistory,
      rates,
      futureFrom,
      to,
    )) {
      list.push({
        subscription: e.subscription,
        date: e.date,
        amountMinor: e.amountMinor,
        currency: e.currency,
        kind: 'planned',
      });
    }
    return list;
  }, [month, subs, priceHistory, rates, payments, today]);

  const byDate = useMemo(() => {
    const map = new Map<DateString, DayEntry[]>();
    for (const e of entries) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [entries]);

  const monthTotal = entries.reduce(
    (sum, e) => sum + (toJpy(fromMinor(e.amountMinor, e.currency), e.currency, rates) ?? 0),
    0,
  );

  if (!isPremium) {
    return (
      <Screen>
        <ScreenHeader showBack title="支払いカレンダー" />
        <EmptyState
          icon="lock"
          title="プレミアムプランの機能です"
          description="カレンダーで支払い履歴と請求予定を確認できます。"
          actionLabel="戻る"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const first = parseDate(month);
  const leading = first.getDay();
  const daysInMonth = parseDate(endOfMonth(month)).getDate();
  const cells: (DateString | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => `${month.slice(0, 8)}${String(i + 1).padStart(2, '0')}`,
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const selectedEntries = byDate.get(selected) ?? [];
  const colorOf = (sub: Subscription) =>
    categories.find((c) => c.id === sub.categoryId)?.color ?? accent.primary;

  const moveMonth = (delta: number) => {
    const next = addMonthsTo(month, delta);
    setMonth(next);
    setSelected(compareDate(startOfMonth(today), next) === 0 ? today : next);
  };

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title="支払いカレンダー" />
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.monthBar}>
          <IconButton
            icon="chevron.left"
            fallback="chevron-back"
            size={36}
            accessibilityLabel="前の月"
            onPress={() => moveMonth(-1)}
          />
          <View style={styles.monthTitle}>
            <AppText variant="headline" accessibilityRole="header">
              {first.getFullYear()}年{first.getMonth() + 1}月
            </AppText>
            <AppText variant="caption" tone="secondary">
              支払い {formatMoney(monthTotal)}（予定を含む）
            </AppText>
          </View>
          <IconButton
            icon="chevron.right"
            fallback="chevron-forward"
            size={36}
            accessibilityLabel="次の月"
            onPress={() => moveMonth(1)}
          />
        </View>

        <View style={styles.week}>
          {WEEKDAYS.map((w, i) => (
            <AppText
              key={w}
              variant="caption"
              style={[
                styles.cellText,
                { color: i === 0 ? colors.negative : i === 6 ? colors.info : colors.textTertiary },
              ]}>
              {w}
            </AppText>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((date, i) => {
            if (!date) return <View key={`empty-${i}`} style={styles.cell} />;
            const list = byDate.get(date) ?? [];
            const isSelected = date === selected;
            const isToday = date === today;
            const day = Number(date.slice(8));
            return (
              <Pressable
                key={date}
                accessibilityRole="button"
                accessibilityLabel={`${formatMonthDay(date)}${list.length ? `、${list.length}件の支払い` : ''}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelected(date)}
                style={styles.cell}>
                <View
                  style={[
                    styles.dayCircle,
                    { borderRadius: radius.pill },
                    isSelected ? { backgroundColor: accent.primary } : null,
                  ]}>
                  <AppText
                    variant="footnote"
                    style={{
                      color: isSelected
                        ? colors.onAccent
                        : isToday
                          ? accent.primary
                          : colors.textPrimary,
                      fontWeight: isToday || isSelected ? '700' : '400',
                    }}>
                    {day}
                  </AppText>
                </View>
                <View style={styles.dots}>
                  {list.slice(0, 3).map((e, j) => (
                    <View
                      key={j}
                      style={[
                        styles.dot,
                        e.kind === 'paid'
                          ? { backgroundColor: colorOf(e.subscription) }
                          : { borderWidth: 1, borderColor: colorOf(e.subscription) },
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.legend, { gap: spacing.md }]}>
          <View style={[styles.legendItem, { gap: spacing.xxs }]}>
            <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
            <AppText variant="caption" tone="secondary">
              支払い済み
            </AppText>
          </View>
          <View style={[styles.legendItem, { gap: spacing.xxs }]}>
            <View style={[styles.dot, { borderWidth: 1, borderColor: colors.textSecondary }]} />
            <AppText variant="caption" tone="secondary">
              請求予定
            </AppText>
          </View>
        </View>
      </Card>

      <Card padding={0} style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <AppText variant="headline">{formatMonthDay(selected)}の支払い</AppText>
        {selectedEntries.length === 0 ? (
          <AppText variant="footnote" tone="secondary" style={{ paddingVertical: spacing.md }}>
            この日の支払いはありません
          </AppText>
        ) : (
          selectedEntries.map((e) => (
            <Pressable
              key={`${e.subscription.id}-${e.kind}`}
              accessibilityRole="button"
              accessibilityLabel={`${e.subscription.name}、${formatMinor(e.amountMinor, e.currency)}、${e.kind === 'paid' ? '支払い済み' : '請求予定'}`}
              onPress={() =>
                router.push({ pathname: '/subscription/[id]', params: { id: e.subscription.id } })
              }
              style={[styles.entry, { gap: spacing.sm, paddingVertical: spacing.sm }]}>
              <ServiceIcon subscription={e.subscription} size={36} />
              <AppText variant="body" numberOfLines={1} style={styles.flex}>
                {e.subscription.name}
              </AppText>
              <Badge
                label={e.kind === 'paid' ? '支払い済み' : '予定'}
                tone={e.kind === 'paid' ? 'neutral' : 'info'}
              />
              <AppText variant="callout">{formatMinor(e.amountMinor, e.currency)}</AppText>
            </Pressable>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  monthBar: { flexDirection: 'row', alignItems: 'center' },
  monthTitle: { flex: 1, alignItems: 'center' },
  week: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4, minHeight: 48 },
  cellText: { width: `${100 / 7}%`, textAlign: 'center' },
  dayCircle: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 2, height: 8, marginTop: 2, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  entry: { flexDirection: 'row', alignItems: 'center' },
});
