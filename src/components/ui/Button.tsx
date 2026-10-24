import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'soft' | 'secondary' | 'destructive';
type Size = 'md' | 'sm';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  style,
  accessibilityLabel,
}: Props) {
  const { colors, accent, radius, sizes, spacing, accentShadow } = useTheme();
  const inactive = !!(disabled || loading);
  const height = size === 'md' ? sizes.buttonHeight : sizes.buttonHeightSmall;
  const gradient =
    variant === 'primary' ? accent.gradient : variant === 'soft' ? accent.gradientSoft : null;

  const textColor =
    variant === 'secondary'
      ? colors.textPrimary
      : variant === 'destructive'
        ? colors.negativeText
        : colors.onAccent;
  const flatBackground =
    variant === 'secondary'
      ? colors.surfaceSecondary
      : variant === 'destructive'
        ? colors.negativeSoft
        : undefined;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={[
        {
          height,
          borderRadius: radius.buttonLarge,
          opacity: inactive ? 0.45 : 1,
          boxShadow: variant === 'primary' && !inactive ? accentShadow : undefined,
        },
        style,
      ]}>
      <View
        style={[
          styles.inner,
          { borderRadius: radius.buttonLarge, backgroundColor: flatBackground, gap: spacing.xs },
        ]}>
        {gradient ? (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={18} color={textColor} weight="semibold" /> : null}
            <AppText variant={size === 'md' ? 'headline' : 'callout'} style={{ color: textColor }}>
              {title}
            </AppText>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
