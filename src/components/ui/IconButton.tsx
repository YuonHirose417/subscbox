import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  icon: IconName;
  fallback?: ComponentProps<typeof Icon>['fallback'];
  accessibilityLabel: string;
  onPress?: () => void;
  /** surface=白い円（歯車）、gradient=アクセントの円（＋）、glass=暗い背景上の半透明円（詳細画面） */
  variant?: 'surface' | 'gradient' | 'glass';
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  fallback,
  accessibilityLabel,
  onPress,
  variant = 'surface',
  size,
  style,
}: Props) {
  const { colors, accent, sizes, shadow, accentShadow } = useTheme();
  const diameter = size ?? sizes.iconButton;
  const iconColor = variant === 'surface' ? colors.textPrimary : colors.onAccent;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={Math.max(0, (sizes.touchTarget - diameter) / 2)}
      style={[
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          boxShadow:
            variant === 'surface' ? shadow : variant === 'gradient' ? accentShadow : undefined,
        },
        style,
      ]}>
      <View
        style={[
          styles.inner,
          {
            borderRadius: diameter / 2,
            backgroundColor:
              variant === 'surface'
                ? colors.surface
                : variant === 'glass'
                  ? colors.glass
                  : undefined,
            borderWidth: variant === 'glass' ? StyleSheet.hairlineWidth : 0,
            borderColor: colors.border,
          },
        ]}>
        {variant === 'gradient' ? (
          <LinearGradient
            colors={accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Icon
          name={icon}
          fallback={fallback}
          size={Math.round(diameter * 0.42)}
          color={iconColor}
          weight="medium"
        />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
