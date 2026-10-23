import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';

export type LegendItem = { label: string; color: string; value: string };

type Props = {
  items: readonly LegendItem[];
  style?: StyleProp<ViewStyle>;
};

/** 色ドット・ラベル・値（金額または割合）の縦並び凡例 */
export function ChartLegend({ items, style }: Props) {
  const { spacing } = useTheme();
  return (
    <View style={[{ gap: spacing.sm }, style]}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.row, { gap: spacing.xs }]}
          accessible
          accessibilityLabel={`${item.label}、${item.value}`}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <AppText variant="footnote" tone="secondary" numberOfLines={1} style={styles.label}>
            {item.label}
          </AppText>
          <AppText variant="footnote" style={styles.value}>
            {item.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1 },
  value: { fontVariant: ['tabular-nums'], fontWeight: '500' },
});
