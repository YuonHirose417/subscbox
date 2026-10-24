import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type Props = {
  title: string;
  /** 右側のリンク文言（例：「すべて見る」）。onAction と組で使う */
  actionLabel?: string;
  onAction?: () => void;
  /** 右側に添える補足（例：「平均 ¥11,200」） */
  trailing?: string;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, actionLabel, onAction, trailing, style }: Props) {
  const { accent, spacing } = useTheme();
  return (
    <View style={[styles.row, { gap: spacing.xs }, style]}>
      <AppText variant="headline" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {trailing ? (
        <AppText variant="footnote" tone="secondary">
          {trailing}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={actionLabel}
          hitSlop={12}
          onPress={onAction}
          style={styles.action}>
          <AppText variant="footnote" style={{ color: accent.text }}>
            {actionLabel}
          </AppText>
          <Icon
            name="chevron.right"
            fallback="chevron-forward"
            size={11}
            color={accent.text}
            weight="semibold"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
