import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  Card,
  Icon,
  PressableScale,
  Screen,
  SearchField,
  SectionHeader,
  type IconName,
} from '@/components/ui';
import { featuredServices, type ServicePreset } from '@/data/popularServices';
import { useCategories } from '@/features/categories/store';
import { ModalHeader } from '@/features/subscriptions/components/ModalHeader';
import { ServiceIcon } from '@/features/subscriptions/components/ServiceIcon';
import { PresetRow } from '@/features/subscriptions/components/PresetRow';
import { presetIconSubject, searchPresets } from '@/features/subscriptions/presets';
import { useTheme, withAlpha } from '@/theme';

/** カンプの「カテゴリから探す」の表示名（カテゴリ名と異なるもの） */
const BROWSE_LABELS: Record<string, string> = { cloud: 'クラウドストレージ' };

/** サブスクを追加：サービス選択（人気／検索／カテゴリ） */
export default function AddServiceScreen() {
  const { spacing, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const categories = useCategories();
  const [query, setQuery] = useState('');
  const results = searchPresets(query);
  const trimmed = query.trim();

  const openPreset = (preset: ServicePreset) =>
    router.push({ pathname: '/add/form', params: { serviceKey: preset.key } });
  const openCustom = (name = '', categoryId = 'other') =>
    router.push({ pathname: '/add/form', params: { name, categoryId } });

  return (
    <View style={styles.root}>
      <Screen
        topInset={false}
        contentStyle={{ paddingBottom: insets.bottom + 96, gap: spacing.lg }}
        scrollProps={{ keyboardShouldPersistTaps: 'handled', keyboardDismissMode: 'on-drag' }}>
        <ModalHeader title="サブスクを追加" leading="close" onLeadingPress={() => router.back()} />
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="サービス名で検索（例：Netflix、Spotify）"
        />

        {trimmed ? (
          <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
            {results.map((preset) => (
              <PresetRow
                key={preset.key}
                preset={preset}
                onPress={() => openPreset(preset)}
                separator
              />
            ))}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`${trimmed}をカスタムで追加`}
              onPress={() => openCustom(trimmed)}
              scaleTo={0.99}
              style={[styles.customRow, { gap: spacing.sm, paddingVertical: spacing.sm }]}>
              <View style={[styles.plus, { backgroundColor: colors.infoSoft }]}>
                <Icon name="plus" fallback="add" size={18} color={colors.info} weight="semibold" />
              </View>
              <AppText variant="body" style={styles.flex} numberOfLines={2}>
                “{trimmed}”をカスタムで追加
              </AppText>
            </PressableScale>
          </Card>
        ) : (
          <>
            <View style={{ gap: spacing.sm }}>
              <SectionHeader title="人気のサービス" />
              <View style={styles.grid}>
                {featuredServices.map((preset) => (
                  <PressableScale
                    key={preset.key}
                    accessibilityRole="button"
                    accessibilityLabel={preset.name}
                    onPress={() => openPreset(preset)}
                    style={[styles.gridItem, { gap: spacing.xs, paddingVertical: spacing.xs }]}>
                    <ServiceIcon subscription={presetIconSubject(preset)} size={52} />
                    <AppText variant="caption" numberOfLines={1} style={styles.center}>
                      {preset.shortName ?? preset.name}
                    </AppText>
                  </PressableScale>
                ))}
              </View>
            </View>

            <View style={{ gap: spacing.sm }}>
              <SectionHeader title="カテゴリから探す" />
              <View style={[styles.tiles, { gap: spacing.sm }]}>
                {categories
                  .filter((c) => c.isDefault)
                  .map((c) => (
                    <PressableScale
                      key={c.id}
                      accessibilityRole="button"
                      accessibilityLabel={BROWSE_LABELS[c.id] ?? c.name}
                      onPress={() =>
                        router.push({
                          pathname: '/add/category/[categoryId]',
                          params: { categoryId: c.id },
                        })
                      }
                      style={[
                        styles.tile,
                        {
                          backgroundColor: withAlpha(c.color, 0.12),
                          gap: spacing.sm,
                          padding: spacing.md,
                        },
                      ]}>
                      <Icon
                        name={c.icon as IconName}
                        fallback="pricetag"
                        size={22}
                        color={c.color}
                      />
                      <AppText
                        variant="footnote"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[styles.flex, { color: c.color, fontWeight: '600' }]}>
                        {BROWSE_LABELS[c.id] ?? c.name}
                      </AppText>
                    </PressableScale>
                  ))}
              </View>
            </View>
          </>
        )}
      </Screen>

      <View
        style={[
          styles.footer,
          { paddingHorizontal: spacing.screen, paddingBottom: insets.bottom + spacing.sm },
        ]}>
        <Button title="カスタムで追加する" variant="soft" onPress={() => openCustom(trimmed)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  gridItem: { width: '25%', alignItems: 'center', paddingHorizontal: 4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderCurve: 'continuous',
    minHeight: 60,
  },
  customRow: { flexDirection: 'row', alignItems: 'center' },
  plus: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
