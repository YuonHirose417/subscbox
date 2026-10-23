import { StyleSheet, View } from 'react-native';

import { AppText, Card, Sheet } from '@/components/ui';
import { formatMoney } from '@/domain/money';
import { breakdownAt, type TrendPoint } from '@/domain/trend';
import { useSettingsStore } from '@/features/settings/store';
import { ServiceIcon } from '@/features/subscriptions/components/ServiceIcon';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { useTheme } from '@/theme';

type Props = { point: TrendPoint | null; onClose: () => void };

/** 棒グラフの棒をタップしたときの内訳（その月末時点で有効だったサブスクと月額換算） */
export function BreakdownSheet({ point, onClose }: Props) {
  const { spacing, colors, sizes } = useTheme();
  const items = useSubscriptionStore((s) => s.items);
  const priceHistory = useSubscriptionStore((s) => s.priceHistory);
  const rates = useSettingsStore((s) => s.exchangeRates);
  const isYear = point?.key.length === 4;
  // 年の棒は年末（今年は今日）時点の内訳を示す
  const rows = point ? breakdownAt(items, priceHistory, rates, point.asOf) : [];
  const title = point
    ? isYear
      ? `${point.label}の内訳`
      : `${point.key.slice(0, 4)}年${point.label}の内訳`
    : '';

  return (
    <Sheet visible={point !== null} title={title} onClose={onClose}>
      <Card style={{ gap: spacing.xxs }}>
        <AppText variant="footnote" tone="secondary">
          {isYear ? 'この年の支出（各月の月額換算の合計）' : 'この月の支出（月額換算）'}
        </AppText>
        <AppText variant="title" style={styles.total}>
          {formatMoney(point?.total ?? 0)}
        </AppText>
      </Card>
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        {rows.length === 0 ? (
          <AppText variant="body" tone="secondary" style={{ paddingVertical: spacing.md }}>
            この時点で契約中のサブスクはありません
          </AppText>
        ) : (
          rows.map(({ subscription, amount }, index) => (
            <View
              key={subscription.id}
              accessible
              accessibilityLabel={`${subscription.name}、月額換算${formatMoney(amount)}`}
              style={[styles.row, { gap: spacing.sm, paddingVertical: spacing.sm }]}>
              <ServiceIcon subscription={subscription} size={36} />
              <AppText variant="body" numberOfLines={1} style={styles.flex}>
                {subscription.name}
              </AppText>
              <AppText variant="callout">{formatMoney(amount)}/月</AppText>
              {index < rows.length - 1 ? (
                <View
                  style={[
                    styles.separator,
                    {
                      left: 36 + spacing.sm,
                      height: sizes.hairline,
                      backgroundColor: colors.hairline,
                    },
                  ]}
                />
              ) : null}
            </View>
          ))
        )}
      </Card>
      {isYear ? (
        <AppText variant="caption" tone="tertiary">
          一覧は{point?.asOf.slice(0, 4)}年の最終時点で契約中だったサブスクです
        </AppText>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  total: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  separator: { position: 'absolute', right: 0, bottom: 0 },
});
