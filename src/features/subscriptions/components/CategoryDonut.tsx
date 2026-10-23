import { StyleSheet, View } from 'react-native';

import { ChartLegend } from '@/components/charts/ChartLegend';
import { DonutChart } from '@/components/charts/DonutChart';
import { AppText, CountUpText } from '@/components/ui';
import type { CategoryBreakdown } from '@/domain/aggregation';
import { formatMoney } from '@/domain/money';
import type { Period } from '@/domain/types';
import { useTheme } from '@/theme';

type Props = {
  breakdown: CategoryBreakdown;
  period: Period;
  /** 凡例の値：amount=金額（ホーム）、ratio=割合％（カテゴリ別の支出） */
  legendValue?: 'amount' | 'ratio';
  /** 中央の見出し（既定「合計」） */
  centerLabel?: string;
  size?: number;
};

const PERIOD_SUFFIX: Record<Period, string> = { month: '/月', year: '/年', all: '累計' };

/** カテゴリ別ドーナツ（左）＋凡例（右） */
export function CategoryDonut({
  breakdown,
  period,
  legendValue = 'amount',
  centerLabel = '合計',
  size = 150,
}: Props) {
  const { spacing, colors } = useTheme();
  const segments = breakdown.segments.map((s) => ({
    value: s.amount,
    color: s.color,
    label: s.name,
  }));
  const legend =
    breakdown.segments.length > 0
      ? breakdown.segments.map((s) => ({
          label: s.name,
          color: s.color,
          value: legendValue === 'amount' ? formatMoney(s.amount) : `${Math.round(s.ratio * 100)}%`,
        }))
      : [{ label: 'データなし', color: colors.surfaceSecondary, value: formatMoney(0) }];

  const spoken = breakdown.segments
    .map((s) => `${s.name} ${Math.round(s.ratio * 100)}パーセント`)
    .join('、');

  return (
    <View style={[styles.row, { gap: spacing.lg }]}>
      <DonutChart
        segments={segments}
        size={size}
        accessibilityLabel={`カテゴリ別の支出。${centerLabel}${formatMoney(breakdown.total)}。${spoken}`}
        center={
          <View style={styles.center}>
            <AppText variant="footnote" tone="secondary">
              {centerLabel}
            </AppText>
            <CountUpText
              value={breakdown.total}
              format={(v) => formatMoney(v)}
              variant="title"
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[styles.centerValue, { maxWidth: size * 0.62 }]}
            />
            {period !== 'all' ? (
              <AppText variant="footnote" tone="secondary">
                {PERIOD_SUFFIX[period]}
              </AppText>
            ) : null}
          </View>
        }
      />
      <ChartLegend items={legend} style={styles.legend} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center' },
  centerValue: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  legend: { flex: 1 },
});
