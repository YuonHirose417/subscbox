import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { maxFontSizeMultiplier, useTheme } from '@/theme';

import { Icon } from './Icon';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
  /** 右端に置く小さなボタン（一覧の並び替えなど） */
  trailing?: ReactNode;
};

export function SearchField({
  value,
  onChangeText,
  placeholder,
  style,
  autoFocus,
  trailing,
}: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  return (
    <View
      style={[
        styles.field,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          gap: spacing.xs,
        },
        style,
      ]}>
      <Icon name="magnifyingglass" fallback="search" size={16} color={colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel={placeholder}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        style={[styles.input, typography.body, { color: colors.textPrimary }]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="検索文字をクリア"
          hitSlop={12}
          onPress={() => onChangeText('')}>
          <Icon
            name="xmark.circle.fill"
            fallback="close-circle"
            size={16}
            color={colors.textTertiary}
          />
        </Pressable>
      ) : null}
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  input: { flex: 1, paddingVertical: 10 },
});
