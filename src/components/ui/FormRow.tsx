import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  /** 右側（または stacked のとき下側）に置く入力部品・値 */
  children?: ReactNode;
  /** 入力エラー（行の下に赤字で表示） */
  error?: string | null;
  /** 補足（行の下に灰色で表示） */
  hint?: string;
  /** ラベルの下に入力部品を置く（メモなど幅が必要なもの） */
  stacked?: boolean;
  separator?: boolean;
  onPress?: () => void;
  showChevron?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** カード内の「ラベル ― 値」の1行（詳細画面の情報カード・入力フォームで共通） */
export function FormRow({
  label,
  children,
  error,
  hint,
  stacked = false,
  separator = false,
  onPress,
  showChevron,
  accessibilityLabel,
  style,
}: Props) {
  const { colors, spacing, sizes } = useTheme();
  const chevron = showChevron ?? !!onPress;

  const content = (
    <View
      style={[
        {
          paddingVertical: spacing.sm,
          gap: spacing.xxs,
          minHeight: sizes.touchTarget + spacing.xs,
          justifyContent: 'center',
        },
        style,
      ]}>
      <View
        style={[stacked ? styles.stacked : styles.row, { gap: stacked ? spacing.xs : spacing.sm }]}>
        <AppText variant="footnote" tone="secondary" style={stacked ? null : styles.label}>
          {label}
        </AppText>
        <View style={stacked ? null : styles.value}>{children}</View>
        {chevron ? (
          <Icon
            name="chevron.right"
            fallback="chevron-forward"
            size={13}
            color={colors.textTertiary}
            weight="semibold"
          />
        ) : null}
      </View>
      {error ? (
        <AppText
          variant="caption"
          style={{ color: colors.negativeText }}
          accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="tertiary">
          {hint}
        </AppText>
      ) : null}
      {separator ? (
        <View
          style={[styles.separator, { height: sizes.hairline, backgroundColor: colors.hairline }]}
        />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      scaleTo={0.99}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  stacked: {},
  label: { minWidth: 88 },
  value: { flex: 1, alignItems: 'flex-end' },
  separator: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
