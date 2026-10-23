import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Icon, PressableScale } from '@/components/ui';
import { daysUntil } from '@/domain/billing';
import { formatDaysLeft, formatFullDate, formatMonthDay } from '@/domain/dates';
import type { ExchangeRates, Subscription } from '@/domain/types';
import { useTheme } from '@/theme';

import { formatSubscriptionPrice, spokenPrice } from '../format';
import { RenewalBadge } from './RenewalBadge';
import { ServiceIcon } from './ServiceIcon';

type Props = {
  subscription: Subscription;
  today: string;
  rates: ExchangeRates;
  /** list=一覧（「2025年10月20日に更新」＋›）、compact=ホームのまもなく更新（「10月20日」） */
  variant?: 'list' | 'compact';
  separator?: boolean;
  onPress?: () => void;
};

export function SubscriptionRow({
  subscription: sub,
  today,
  rates,
  variant = 'list',
  separator = false,
  onPress,
}: Props) {
  const { spacing, colors, sizes } = useTheme();
  const cancelled = sub.status === 'cancelled';
  const daysLeft = daysUntil(sub.nextRenewalDate, today);
  const dateText =
    variant === 'list'
      ? `${formatFullDate(sub.nextRenewalDate)}に更新`
      : formatMonthDay(sub.nextRenewalDate);
  const label = [
    sub.name,
    sub.planName,
    spokenPrice(sub),
    cancelled ? '解約済み' : `${formatDaysLeft(daysLeft)}で更新`,
  ]
    .filter(Boolean)
    .join('、');

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.row, { gap: spacing.sm, paddingVertical: spacing.sm }]}>
      <ServiceIcon subscription={sub} />
      <View style={styles.main}>
        <AppText variant="headline" numberOfLines={1}>
          {sub.name}
        </AppText>
        {sub.planName ? (
          <AppText variant="footnote" tone="secondary" numberOfLines={1}>
            {sub.planName}
          </AppText>
        ) : null}
        <AppText variant="footnote" tone="secondary" numberOfLines={1}>
          {cancelled ? '解約済み' : dateText}
        </AppText>
      </View>
      <View style={[styles.side, { gap: spacing.xxs + 2 }]}>
        <AppText variant="callout" numberOfLines={1} style={styles.price}>
          {formatSubscriptionPrice(sub, rates)}
        </AppText>
        {cancelled ? (
          <Badge label="解約済み" tone="neutral" style={styles.badge} />
        ) : (
          <RenewalBadge daysLeft={daysLeft} style={styles.badge} />
        )}
      </View>
      {variant === 'list' ? (
        <Icon
          name="chevron.right"
          fallback="chevron-forward"
          size={13}
          color={colors.textTertiary}
          weight="semibold"
        />
      ) : null}
      {separator ? (
        <View
          style={[
            styles.separator,
            {
              left: sizes.serviceIcon + spacing.sm,
              height: sizes.hairline,
              backgroundColor: colors.hairline,
            },
          ]}
        />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  main: { flex: 1, gap: 1 },
  side: { alignItems: 'flex-end', flexShrink: 1, maxWidth: '45%' },
  price: { textAlign: 'right' },
  badge: { alignSelf: 'flex-end' },
  separator: { position: 'absolute', right: 0, bottom: 0 },
});
