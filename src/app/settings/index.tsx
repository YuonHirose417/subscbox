import { router } from 'expo-router';

import { Card, ListRow, Screen, ScreenHeader } from '@/components/ui';
import { useSettingsStore } from '@/features/settings/store';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

/** 設定（フェーズ1は見た目のみ。遷移先はフェーズ5） */
export default function SettingsScreen() {
  const { spacing, colors } = useTheme();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const t = ja.settings;

  return (
    <Screen>
      <ScreenHeader showBack title={ja.screens.settings.title} />
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow icon="bell" title={t.notifications} onPress={() => {}} separator />
        <ListRow icon="icloud" title={t.backup} onPress={() => {}} separator />
        <ListRow
          icon="moon"
          title={t.theme}
          value={t.themeValues[themePreference]}
          onPress={() => {}}
          separator
        />
        <ListRow icon="crown" iconColor={colors.warning} title={t.premium} onPress={() => {}} />
      </Card>
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow icon="questionmark.circle" title={t.faq} onPress={() => {}} separator />
        <ListRow icon="envelope" title={t.contact} onPress={() => {}} />
      </Card>
      {__DEV__ ? (
        <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
          <ListRow
            icon="paintpalette"
            title={t.devCatalog}
            onPress={() => router.push('/dev/catalog')}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
