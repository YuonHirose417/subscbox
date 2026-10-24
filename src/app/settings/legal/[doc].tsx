import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen, ScreenHeader } from '@/components/ui';
import { licenses, privacyPolicy, termsOfUse, type Section } from '@/data/legal';
import { useTheme } from '@/theme';

const DOCS: Record<string, { title: string; sections: readonly Section[] }> = {
  privacy: { title: 'プライバシーポリシー', sections: privacyPolicy },
  terms: { title: '利用規約', sections: termsOfUse },
};

/** プライバシーポリシー・利用規約・ライセンスの静的ページ */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const { spacing, colors, sizes } = useTheme();

  if (doc === 'licenses') {
    return (
      <Screen contentStyle={{ gap: spacing.md }}>
        <ScreenHeader showBack title="ライセンス" />
        <AppText variant="footnote" tone="secondary">
          本アプリは以下のオープンソースソフトウェアを利用しています。
        </AppText>
        <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
          {licenses.map((item, index) => (
            <View
              key={item.name}
              style={[
                styles.row,
                { paddingVertical: spacing.sm, gap: spacing.sm },
                index < licenses.length - 1
                  ? { borderBottomWidth: sizes.hairline, borderBottomColor: colors.hairline }
                  : null,
              ]}>
              <AppText variant="body" style={styles.flex}>
                {item.name}
              </AppText>
              <AppText variant="footnote" tone="secondary">
                {item.license}
              </AppText>
            </View>
          ))}
        </Card>
      </Screen>
    );
  }

  const page = DOCS[doc ?? ''] ?? DOCS.privacy;
  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title={page.title} />
      <Card style={{ gap: spacing.md }}>
        {page.sections.map((s) => (
          <View key={s.heading} style={{ gap: spacing.xxs }}>
            <AppText variant="headline" accessibilityRole="header">
              {s.heading}
            </AppText>
            <AppText variant="footnote" tone="secondary">
              {s.body}
            </AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
