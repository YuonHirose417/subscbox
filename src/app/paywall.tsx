import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon, Screen } from '@/components/ui';
import { FREE_LIMITS } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/usePremium';
import { ModalHeader } from '@/features/subscriptions/components/ModalHeader';
import { premiumService } from '@/services/premium';
import { useTheme } from '@/theme';
import { logger } from '@/utils/logger';

const FEATURES = [
  '広告の非表示',
  `サブスクの登録数が無制限（無料版は${FREE_LIMITS.subscriptions}件まで）`,
  `自作カテゴリが無制限（無料版は${FREE_LIMITS.customCategories}件まで）`,
  `支払い方法の登録が無制限（無料版は${FREE_LIMITS.paymentMethods}件まで）`,
  'サブスクごとの通知のオン／オフとタイミング',
  '支払い履歴と支払いカレンダー',
  'CSVの書き出し',
  '一覧の並び替え',
  'テーマカラーの変更',
  'アイコンに好きな画像を設定',
] as const;

/** プレミアムプラン（フェーズ7で RevenueCat の価格・購入に置き換える。今は「準備中」） */
export default function PaywallScreen() {
  const { spacing, colors, accent } = useTheme();
  const { isPremium } = usePremium();
  const [restoring, setRestoring] = useState(false);

  const restore = async () => {
    setRestoring(true);
    try {
      const result = await premiumService.restore();
      Alert.alert(
        result.isPremium ? '購入を復元しました' : '復元できる購入はありませんでした',
        result.isPremium ? 'プレミアムプランの機能が使えます。' : undefined,
      );
    } catch (error) {
      logger.error('restore failed', error);
      Alert.alert('復元できませんでした', 'もう一度お試しください');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen topInset={false} contentStyle={{ gap: spacing.md }}>
      <ModalHeader title="プレミアムプラン" leading="close" onLeadingPress={() => router.back()} />
      <Card style={{ gap: spacing.sm }}>
        {FEATURES.map((f) => (
          <View key={f} style={[styles.row, { gap: spacing.sm }]}>
            <Icon
              name="checkmark.circle.fill"
              fallback="checkmark-circle"
              size={18}
              color={accent.primary}
            />
            <AppText variant="body" style={styles.flex}>
              {f}
            </AppText>
          </View>
        ))}
      </Card>
      {isPremium ? (
        <AppText variant="callout" style={{ textAlign: 'center' }}>
          プレミアムプランをご利用中です
        </AppText>
      ) : (
        <Card style={{ alignItems: 'center', gap: spacing.xxs }}>
          <AppText variant="headline">準備中</AppText>
          <AppText variant="footnote" tone="secondary" style={{ textAlign: 'center' }}>
            プレミアムプランの購入は今後のアップデートで提供します。
          </AppText>
        </Card>
      )}
      <Button title="購入を復元" variant="secondary" loading={restoring} onPress={restore} />
      <AppText variant="caption" tone="tertiary" style={{ color: colors.textTertiary }}>
        購入は Apple ID に紐づきます。機種変更や再インストールのあとは「購入を復元」で戻せます。
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
