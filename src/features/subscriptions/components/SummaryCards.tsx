import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, type IconName } from '@/components/ui';
import { formatMoney } from '@/domain/money';
import { useTheme } from '@/theme';

type Props = { activeCount: number; yearlyForecast: number };

/** 「登録中のサブスク 8件」「年間の支払い（予想）¥148,080」の2枚横並び */
export function SummaryCards({ activeCount, yearlyForecast }: Props) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <SummaryCard
        icon="creditcard.fill"
        fallback="card"
        label="登録中のサブスク"
        value={`${activeCount}件`}
      />
      <SummaryCard
        icon="calendar"
        fallback="calendar"
        label="年間の支払い（予想）"
        value={formatMoney(yearlyForecast)}
      />
    </View>
  );
}

function SummaryCard({
  icon,
  fallback,
  label,
  value,
}: {
  icon: IconName;
  fallback: ComponentProps<typeof Icon>['fallback'];
  label: string;
  value: string;
}) {
  const { spacing, colors, accent, radius } = useTheme();
  return (
    <Card variant="inner" style={[styles.card, { gap: spacing.sm, padding: spacing.sm }]}>
      <View
        style={[styles.iconTile, { backgroundColor: colors.infoSoft, borderRadius: radius.icon }]}>
        <Icon name={icon} fallback={fallback} size={20} color={accent.primary} />
      </View>
      <View style={styles.text} accessible accessibilityLabel={`${label}、${value}`}>
        <AppText variant="caption" tone="secondary" numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </AppText>
        <AppText variant="headline" numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
          {value}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconTile: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  value: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});
