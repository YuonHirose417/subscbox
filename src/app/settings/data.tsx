import { router } from 'expo-router';

import { AppText, Card, ListRow, Screen, ScreenHeader } from '@/components/ui';
import { useSettingsStore } from '@/features/settings/store';
import { useTheme } from '@/theme';

/** データのバックアップ（書き出し・復元・全削除はフェーズ5で追加） */
export default function DataSettingsScreen() {
  const { spacing } = useTheme();
  const rateCount = Object.keys(useSettingsStore((s) => s.exchangeRates)).length;
  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title="データのバックアップ" />
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          icon="yensign.circle"
          title="外貨の為替レート"
          value={rateCount > 0 ? `${rateCount}通貨` : '未設定'}
          onPress={() => router.push('/settings/currency')}
        />
      </Card>
      <AppText variant="caption" tone="tertiary">
        データの書き出し・復元・全削除はフェーズ5で追加します。
      </AppText>
    </Screen>
  );
}
