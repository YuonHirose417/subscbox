import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export type BadgeTone = 'negative' | 'warning' | 'positive' | 'info';

type Props = {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
};

/** 「あと3日」等。淡色背景＋同系色テキスト、角丸999 */
export function Badge({ label, tone = 'info', style }: Props) {
  const { colors, radius, spacing } = useTheme();
  const map = {
    negative: [colors.negativeSoft, colors.negative],
    warning: [colors.warningSoft, colors.warning],
    positive: [colors.positiveSoft, colors.positive],
    info: [colors.infoSoft, colors.info],
  } as const;
  const [background, foreground] = map[tone];

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: background,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.xs,
          paddingVertical: 3,
        },
        style,
      ]}>
      <AppText variant="caption" style={{ color: foreground }}>
        {label}
      </AppText>
    </View>
  );
}
