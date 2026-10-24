import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText, Card, Icon, ListRow, Screen, ScreenHeader, SectionHeader } from '@/components/ui';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore, type ThemePreference } from '@/features/settings/store';
import { ja } from '@/i18n/ja';
import { accentPresets, useTheme, type AccentPresetId } from '@/theme';

const THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'];
const PRESET_IDS = Object.keys(accentPresets) as AccentPresetId[];

/** テーマ：システム・ライト・ダーク（無料）と、アクセントカラー（プレミアム） */
export default function ThemeSettingsScreen() {
  const { spacing, accent, colors, scheme } = useTheme();
  const { isPremium } = usePremium();
  const preference = useSettingsStore((s) => s.themePreference);
  const setPreference = useSettingsStore((s) => s.setThemePreference);
  const accentPreset = useSettingsStore((s) => s.accentPreset);
  const setAccentPreset = useSettingsStore((s) => s.setAccentPreset);
  const selectedPreset = isPremium ? accentPreset : 'default';

  const check = (
    <Icon
      name="checkmark"
      fallback="checkmark"
      size={17}
      color={accent.primary}
      weight="semibold"
    />
  );

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title={ja.settings.theme} />
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        {THEMES.map((t, i) => (
          <ListRow
            key={t}
            icon={t === 'system' ? 'iphone' : t === 'light' ? 'sun.max' : 'moon'}
            title={ja.settings.themeValues[t]}
            showChevron={false}
            trailing={preference === t ? check : undefined}
            separator={i < THEMES.length - 1}
            accessibilityLabel={`${ja.settings.themeValues[t]}${preference === t ? '、選択中' : ''}`}
            onPress={() => setPreference(t)}
          />
        ))}
      </Card>
      <AppText variant="caption" tone="tertiary">
        「システム」は iPhone の外観設定（ライト／ダーク）に合わせて切り替わります。
      </AppText>

      <SectionHeader title="テーマカラー" />
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        {PRESET_IDS.map((id, i) => {
          const palette = accentPresets[id][scheme];
          const locked = !isPremium && id !== 'default';
          return (
            <ListRow
              key={id}
              leading={
                <LinearGradient
                  colors={palette.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.swatch}
                />
              }
              title={accentPresets[id].label}
              showChevron={false}
              trailing={
                selectedPreset === id ? (
                  check
                ) : locked ? (
                  <Icon
                    name="lock.fill"
                    fallback="lock-closed"
                    size={13}
                    color={colors.textTertiary}
                  />
                ) : undefined
              }
              separator={i < PRESET_IDS.length - 1}
              accessibilityLabel={`${accentPresets[id].label}${selectedPreset === id ? '、選択中' : locked ? '、プレミアム' : ''}`}
              onPress={() => (locked ? router.push('/paywall') : setAccentPreset(id))}
            />
          );
        })}
      </Card>
      {isPremium ? null : (
        <AppText variant="caption" tone="tertiary">
          テーマカラーの変更はプレミアムプランの機能です。
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  swatch: { width: 24, height: 24, borderRadius: 12 },
});
