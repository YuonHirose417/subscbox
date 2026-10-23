import { router } from 'expo-router';

import { AppText, Card, SectionHeader } from '@/components/ui';
import type { ExchangeRates, Subscription } from '@/domain/types';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

import { SubscriptionRow } from './SubscriptionRow';

type Props = {
  items: readonly Subscription[];
  today: string;
  rates: ExchangeRates;
  onPressItem: (sub: Subscription) => void;
};

/** ホームの「まもなく更新」（次回更新日が近い順に最大3件） */
export function UpcomingRenewals({ items, today, rates, onPressItem }: Props) {
  const { spacing } = useTheme();
  return (
    <Card style={{ paddingVertical: spacing.sm }}>
      <SectionHeader
        title="まもなく更新"
        actionLabel={ja.common.seeAll}
        onAction={() => router.push('/subscriptions')}
        style={{ paddingTop: spacing.xxs, paddingBottom: spacing.xxs }}
      />
      {items.length === 0 ? (
        <AppText variant="footnote" tone="secondary" style={{ paddingVertical: spacing.sm }}>
          更新予定のサブスクはありません
        </AppText>
      ) : (
        items.map((sub, index) => (
          <SubscriptionRow
            key={sub.id}
            subscription={sub}
            today={today}
            rates={rates}
            variant="compact"
            separator={index < items.length - 1}
            onPress={() => onPressItem(sub)}
          />
        ))
      )}
    </Card>
  );
}
