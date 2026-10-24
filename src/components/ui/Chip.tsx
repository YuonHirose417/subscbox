import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

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
  const { colors, accent, radius } = useTheme();
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
          paddingHorizontal: 14,
          backgroundColor: selected ? undefined : colors.surfaceSecondary,
          // 選択中だけ弱い発光
          boxShadow: selected ? accent.glow : undefined,
        },
      ]}>
      {selected ? (
        <View style={[StyleSheet.absoluteFill, styles.fill, { borderRadius: radius.pill }]}>
          <LinearGradient
            colors={accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
      <AppText
        variant="label"
        style={{
          fontWeight: selected ? '700' : '600',
          color: selected ? colors.onAccent : colors.textSecondary,
        }}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { height: 32, alignItems: 'center', justifyContent: 'center' },
  fill: { overflow: 'hidden' },
});
