import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking } from 'react-native';

import { Card, ListRow, Screen, ScreenHeader } from '@/components/ui';
import { APP_VERSION, SUPPORT_CONTACT } from '@/constants/app';
import { useSettingsStore } from '@/features/settings/store';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';
import { logger } from '@/utils/logger';

/** メールアドレスならメールアプリ、URL ならブラウザでお問い合わせ先を開く */
async function openContact() {
  const contact = SUPPORT_CONTACT.trim();
  if (!contact) {
    Alert.alert('準備中です', 'お問い合わせ窓口は公開時に用意します。');
    return;
  }
  const isUrl = /^https:\/\//i.test(contact);
  const subject = encodeURIComponent('サブスクBoxへのお問い合わせ');
  const body = encodeURIComponent(`\n\n----\nアプリのバージョン：${APP_VERSION}`);
  try {
    if (isUrl) await WebBrowser.openBrowserAsync(contact);
    else await Linking.openURL(`mailto:${contact}?subject=${subject}&body=${body}`);
  } catch (error) {
    logger.error('failed to open contact', error);
    Alert.alert(
      isUrl ? 'ページを開けませんでした' : 'メールアプリを開けませんでした',
      `${contact} までご連絡ください。`,
    );
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
      <Card variant="inner" padding={0} style={{ paddingHorizontal: spacing.md }}>
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
      <Card variant="inner" padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="questionmark.circle"
          title={t.faq}
          onPress={() => router.push('/settings/faq')}
          separator
        />
        <ListRow icon="envelope" title={t.contact} onPress={openContact} />
      </Card>
      {__DEV__ ? (
        <Card variant="inner" padding={0} style={{ paddingHorizontal: spacing.md }}>
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
