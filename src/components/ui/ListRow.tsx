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
/** 淡い色の円に入れたアイコン（詳細画面の操作行。カンプ実測 34pt） */
const LEADING_BADGE = 34;

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
  const { colors, accent, spacing, sizes } = useTheme();
  const tint = destructive ? colors.negative : (iconColor ?? accent.primary);
  const hasLeading = !!(leading || icon);
  const chevron = showChevron ?? !!onPress;
  const leadingSize = iconBackground ? LEADING_BADGE : LEADING_WIDTH;

  const content = (
    <View
      style={[
        styles.row,
        // 行の高さはカンプ実測（設定 46pt / 操作行 48pt）。指で押せる 44pt は下回らない
        { minHeight: iconBackground ? 48 : 46, gap: spacing.sm },
      ]}>
      {leading ??
        (icon ? (
          <View
            style={[
              styles.leading,
              { width: leadingSize, height: leadingSize },
              iconBackground
                ? { backgroundColor: iconBackground, borderRadius: leadingSize / 2 }
                : null,
            ]}>
            <Icon name={icon} size={iconBackground ? 17 : 19} color={tint} />
          </View>
        ) : null)}
      <AppText
        variant="body"
        numberOfLines={1}
        style={[
          styles.title,
          iconBackground ? styles.strong : null,
          destructive ? { color: colors.negativeText } : null,
        ]}>
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
          size={14}
          color={colors.textTertiary}
          weight="semibold"
        />
      ) : null}
      {separator ? (
        <View
          style={[
            styles.separator,
            {
              left: hasLeading ? leadingSize + spacing.sm : 0,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  strong: { fontWeight: '600' },
  value: { flexShrink: 1, textAlign: 'right' },
  separator: { position: 'absolute', right: 0, bottom: 0 },
});
