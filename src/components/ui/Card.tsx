import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  children: ReactNode;
  /** card=外側のカード（角丸20）、inner=内部カード・タイル（角丸16） */
  variant?: 'card' | 'inner';
  /** 内側の余白（既定 16）。リストを入れる場合は 0 にする */
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, variant = 'card', padding, style }: Props) {
  const { colors, radius, spacing, shadow, scheme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: variant === 'card' ? radius.card : radius.inner,
          borderCurve: 'continuous',
          padding: padding ?? spacing.md,
          boxShadow: shadow,
          // ダークは影の代わりに border で区切る
          borderWidth: scheme === 'dark' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
