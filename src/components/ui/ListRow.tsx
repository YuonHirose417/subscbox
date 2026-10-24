import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  title: string;
  /** 左端のアイコン。leading を渡した場合はそちらが優先 */
  icon?: IconName;
  /** アイコン色（既定はアクセント） */
  iconColor?: string;
  /** アイコンの背後に淡い色付き角丸を敷く（詳細画面のアクションカード） */
  iconBackground?: string;
  leading?: ReactNode;
  /** 右側の値（例：「システム」「¥1,590」） */
  value?: string;
  /** 値の代わりに右側に置く要素（Toggle など） */
  trailing?: ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
  /** 次の行との区切り線（左はアイコン幅分インセット） */
  separator?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

const LEADING_WIDTH = 28;

export function ListRow({
  title,
  icon,
  iconColor,
  iconBackground,
  leading,
  value,
  trailing,
  showChevron,
  destructive,
  separator = false,
  onPress,
  accessibilityLabel,
}: Props) {
  const { colors, accent, spacing, radius, sizes } = useTheme();
  const tint = destructive ? colors.negative : (iconColor ?? accent.primary);
  const hasLeading = !!(leading || icon);
  const chevron = showChevron ?? !!onPress;

  const content = (
    <View style={[styles.row, { minHeight: sizes.touchTarget + spacing.xs, gap: spacing.sm }]}>
      {leading ??
        (icon ? (
          <View
            style={[
              styles.leading,
              iconBackground
                ? {
                    backgroundColor: iconBackground,
                    borderRadius: radius.sm,
                    borderCurve: 'continuous',
                  }
                : null,
            ]}>
            <Icon name={icon} size={iconBackground ? 16 : 19} color={tint} />
          </View>
        ) : null)}
      <AppText
        variant="body"
        numberOfLines={1}
        style={[styles.title, destructive ? { color: colors.negativeText } : null]}>
        {title}
      </AppText>
      {value ? (
        <AppText variant="footnote" tone="secondary" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {trailing}
      {chevron ? (
        <Icon
          name="chevron.right"
          fallback="chevron-forward"
          size={13}
          color={colors.textTertiary}
          weight="semibold"
        />
      ) : null}
      {separator ? (
        <View
          style={[
            styles.separator,
            {
              left: hasLeading ? LEADING_WIDTH + spacing.sm : 0,
              height: sizes.hairline,
              backgroundColor: colors.hairline,
            },
          ]}
        />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${title}、${value}` : title)}
      onPress={onPress}
      scaleTo={0.99}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  leading: {
    width: LEADING_WIDTH,
    height: LEADING_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  value: { flexShrink: 1, textAlign: 'right' },
  separator: { position: 'absolute', right: 0, bottom: 0 },
});
