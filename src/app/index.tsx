import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  EmptyState,
  IconButton,
  PressableScale,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

/** ホーム（フェーズ1はプレースホルダー。本実装はフェーズ2） */
export default function HomeScreen() {
  const { spacing } = useTheme();
  const t = ja.screens.home;

  return (
    <Screen tint>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <AppText variant="title" accessibilityRole="header">
            {t.titleLine1}
            {'\n'}
            {t.titleLine2}
          </AppText>
        </View>
        <IconButton
          icon="gearshape"
          fallback="settings-outline"
          accessibilityLabel={ja.screens.settings.title}
          onPress={() => router.push('/settings')}
        />
      </View>

      {/* フェーズ2でドーナツグラフカードに置き換え。タップで支出の分析へ */}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={ja.screens.analytics.title}
        onPress={() => router.push('/analytics')}>
        <Card style={{ gap: spacing.xs }}>
          <AppText variant="headline">カテゴリ別ドーナツ（フェーズ2）</AppText>
          <AppText variant="footnote" tone="secondary">
            タップで「支出の分析」へ
          </AppText>
        </Card>
      </PressableScale>

      <Card>
        <SectionHeader
          title="まもなく更新"
          actionLabel={ja.common.seeAll}
          onAction={() => router.push('/subscriptions')}
        />
        <EmptyState icon="tray" title={ja.empty.homeTitle} description={ja.empty.homeBody} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 8 },
  headerTitle: { flex: 1 },
});
