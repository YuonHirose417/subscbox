import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';

import { Card, ListRow, Screen, ScreenHeader } from '@/components/ui';
import { APP_VERSION, SUPPORT_EMAIL } from '@/constants/app';
import { useSettingsStore } from '@/features/settings/store';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';
import { logger } from '@/utils/logger';

async function openContact() {
  if (!SUPPORT_EMAIL) {
    Alert.alert('準備中です', 'お問い合わせ窓口は公開時に用意します。');
    return;
  }
  const subject = encodeURIComponent('サブスクBoxへのお問い合わせ');
  const body = encodeURIComponent(`\n\n----\nアプリのバージョン：${APP_VERSION}`);
  try {
    await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  } catch (error) {
    logger.error('failed to open mail', error);
    Alert.alert('メールアプリを開けませんでした', `${SUPPORT_EMAIL} までご連絡ください。`);
  }
}

/** 設定（カンプ通り2枚のカード。各項目の詳細は遷移先に置く） */
export default function SettingsScreen() {
  const { spacing, colors } = useTheme();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const t = ja.settings;

  return (
    <Screen>
      <ScreenHeader showBack title={ja.screens.settings.title} />
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="bell"
          title={t.notifications}
          onPress={() => router.push('/settings/notifications')}
          separator
        />
        <ListRow
          icon="icloud"
          title={t.backup}
          onPress={() => router.push('/settings/data')}
          separator
        />
        <ListRow
          icon="moon"
          title={t.theme}
          value={t.themeValues[themePreference]}
          onPress={() => router.push('/settings/theme')}
          separator
        />
        <ListRow
          icon="crown"
          iconColor={colors.warning}
          title={t.premium}
          onPress={() => router.push('/paywall')}
        />
      </Card>
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="questionmark.circle"
          title={t.faq}
          onPress={() => router.push('/settings/faq')}
          separator
        />
        <ListRow icon="envelope" title={t.contact} onPress={openContact} />
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
