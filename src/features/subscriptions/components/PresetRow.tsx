import { StyleSheet, View } from 'react-native';

import { AppText, Icon, PressableScale } from '@/components/ui';
import type { ServicePreset } from '@/data/popularServices';
import { useCategories } from '@/features/categories/store';
import { useTheme } from '@/theme';

import { presetIconSubject } from '../presets';
import { ServiceIcon } from './ServiceIcon';

/** 人気サービスの1行（検索結果・カテゴリ別一覧） */
export function PresetRow({
  preset,
  onPress,
  separator,
}: {
  preset: ServicePreset;
  onPress: () => void;
  separator?: boolean;
}) {
  const { spacing, colors, sizes } = useTheme();
  const categories = useCategories();
  const category = categories.find((c) => c.id === preset.categoryId);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={preset.name}
      onPress={onPress}
      scaleTo={0.99}
      style={[styles.row, { gap: spacing.sm, paddingVertical: spacing.sm }]}>
      <ServiceIcon subscription={presetIconSubject(preset)} />
      <View style={styles.flex}>
        <AppText variant="headline" numberOfLines={1}>
          {preset.name}
        </AppText>
        <AppText variant="footnote" tone="secondary">
          {category?.name}
        </AppText>
      </View>
      <Icon name="chevron.right" fallback="chevron-forward" size={13} color={colors.textTertiary} />
      {separator ? (
        <View
          style={[
            styles.separator,
            {
              left: sizes.serviceIcon + spacing.sm,
              height: sizes.hairline,
              backgroundColor: colors.hairline,
            },
          ]}
        />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  separator: { position: 'absolute', right: 0, bottom: 0 },
});
