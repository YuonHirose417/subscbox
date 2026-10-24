import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** カテゴリフィルタ。未選択=surfaceSecondary、選択=アクセントグラデーション＋白文字 */
export function Chip({ label, selected = false, onPress }: Props) {
  const { colors, accent, radius, spacing } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => {
        if (!selected) Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          backgroundColor: selected ? undefined : colors.surfaceSecondary,
        },
      ]}>
      {selected ? (
        <LinearGradient
          colors={accent.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <AppText
        variant="footnote"
        style={{
          fontWeight: selected ? '600' : '500',
          color: selected ? colors.onAccent : colors.textSecondary,
        }}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { height: 32, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
