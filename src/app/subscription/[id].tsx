import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppText, Button, Card, EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { formatFullDate } from '@/domain/dates';
import { useSettingsStore } from '@/features/settings/store';
import { ServiceIcon } from '@/features/subscriptions/components/ServiceIcon';
import { confirmDeleteSubscription } from '@/features/subscriptions/confirmDelete';
import { formatSubscriptionPrice } from '@/features/subscriptions/format';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { useTheme } from '@/theme';

/** サブスク詳細（フェーズ2は仮画面。カンプ通りの本実装はフェーズ3） */
export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing } = useTheme();
  const sub = useSubscriptionStore((s) => s.items.find((item) => item.id === id));
  const rates = useSettingsStore((s) => s.exchangeRates);

  if (!sub) {
    return (
      <Screen>
        <ScreenHeader showBack title="" />
        <EmptyState
          icon="questionmark.folder"
          title="サブスクが見つかりませんでした"
          description="削除された可能性があります"
          actionLabel="戻る"
          onAction={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader showBack title={sub.name} />
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <ServiceIcon subscription={sub} />
          <View style={{ flex: 1 }}>
            <AppText variant="headline">{sub.name}</AppText>
            {sub.planName ? (
              <AppText variant="footnote" tone="secondary">
                {sub.planName}
              </AppText>
            ) : null}
          </View>
        </View>
        <AppText variant="body">{formatSubscriptionPrice(sub, rates)}</AppText>
        <AppText variant="footnote" tone="secondary">
          次回更新日：{formatFullDate(sub.nextRenewalDate)}
        </AppText>
        <AppText variant="footnote" tone="tertiary">
          詳細画面はフェーズ3で実装します
        </AppText>
      </Card>
      <Button
        title="削除"
        variant="destructive"
        icon="trash"
        onPress={async () => {
          if (await confirmDeleteSubscription(sub)) router.back();
        }}
      />
    </Screen>
  );
}
