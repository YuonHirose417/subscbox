import { router } from 'expo-router';

import { AppText, Card, ListRow, Screen, ScreenHeader, SectionHeader } from '@/components/ui';
import { APP_VERSION } from '@/constants/app';
import { faqItems } from '@/data/legal';
import { useTheme } from '@/theme';

/** よくある質問。末尾にプライバシーポリシー・利用規約・ライセンス・バージョン */
export default function FaqScreen() {
  const { spacing } = useTheme();
  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title="よくある質問" />
      {faqItems.map((item) => (
        <Card key={item.heading} style={{ gap: spacing.xs }}>
          <AppText variant="headline" accessibilityRole="header">
            {item.heading}
          </AppText>
          <AppText variant="footnote" tone="secondary">
            {item.body}
          </AppText>
        </Card>
      ))}

      <SectionHeader title="アプリについて" />
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="hand.raised"
          title="プライバシーポリシー"
          separator
          onPress={() =>
            router.push({ pathname: '/settings/legal/[doc]', params: { doc: 'privacy' } })
          }
        />
        <ListRow
          icon="doc.text"
          title="利用規約"
          separator
          onPress={() =>
            router.push({ pathname: '/settings/legal/[doc]', params: { doc: 'terms' } })
          }
        />
        <ListRow
          icon="shippingbox"
          title="ライセンス"
          separator
          onPress={() =>
            router.push({ pathname: '/settings/legal/[doc]', params: { doc: 'licenses' } })
          }
        />
        <ListRow icon="info.circle" title="バージョン" value={APP_VERSION} showChevron={false} />
      </Card>
      <AppText variant="caption" tone="tertiary">
        表示される金額・更新日・支払い履歴は、すべてご自身で入力した情報に基づく目安です。
      </AppText>
    </Screen>
  );
}
