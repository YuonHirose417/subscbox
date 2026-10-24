import { Text, type TextProps } from 'react-native';

import { maxFontSizeMultiplier, useTheme, type TypographyVariant } from '@/theme';

export type TextTone =
  'primary' | 'secondary' | 'tertiary' | 'onAccent' | 'accent' | 'negative' | 'positive';

type Props = TextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
};

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: Props) {
  const { typography, colors, accent } = useTheme();
  const color = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    onAccent: colors.onAccent,
    accent: accent.text,
    negative: colors.negativeText,
    positive: colors.positiveText,
  }[tone];

  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
      style={[typography[variant], { color }, style]}
    />
  );
}
