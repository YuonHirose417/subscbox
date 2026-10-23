import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import { customColorChoices, useTheme } from '@/theme';

type Props = { value: string | null; onChange: (color: string) => void };

/** アイコン・カテゴリの色選択（丸い色見本の並び） */
export function ColorChoices({ value, onChange }: Props) {
  const { spacing, colors } = useTheme();
  return (
    <View style={[styles.row, { gap: spacing.xs }]}>
      {customColorChoices.map((color) => {
        const selected = value === color;
        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityLabel={`色 ${color}`}
            accessibilityState={{ selected }}
            hitSlop={4}
            onPress={() => onChange(color)}
            style={[
              styles.swatch,
              {
                backgroundColor: color,
                borderColor: selected ? colors.textPrimary : 'transparent',
              },
            ]}>
            {selected ? (
              <Icon
                name="checkmark"
                fallback="checkmark"
                size={13}
                color={colors.onAccent}
                weight="bold"
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
