import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  PressableScale,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { formatFullDate } from '@/domain/dates';
import { formatMinor, formatMoney, fromMinor, toJpy } from '@/domain/money';
import { PAYMENT_HISTORY_WINDOW_MONTHS, visiblePayments } from '@/domain/payments';
import type { Payment } from '@/domain/types';
import { EditPaymentSheet } from '@/features/payments/EditPaymentSheet';
import { usePayments } from '@/features/payments/usePayments';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { useTheme } from '@/theme';

/** サブスクごとの支払い履歴（プレミアム）。請求日から自動生成し、個別に修正・削除できる */
export default function PaymentHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing, colors, sizes } = useTheme();
  const { isPremium } = usePremium();
  const sub = useSubscriptionStore((s) => s.items.find((item) => item.id === id));
  const rates = useSettingsStore((s) => s.exchangeRates);
  const payments = visiblePayments(usePayments(), id);
  const [editing, setEditing] = useState<Payment | null>(null);

  if (!isPremium || !sub) {
    return (
      <Screen>
        <ScreenHeader showBack title="支払い履歴" />
        <EmptyState
          icon={sub ? 'lock' : 'questionmark.folder'}
          title={sub ? 'プレミアムプランの機能です' : 'サブスクが見つかりませんでした'}
          description={
            sub ? '過去の支払い履歴の確認・修正はプレミアムプランで利用できます。' : undefined
          }
          actionLabel="戻る"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const total = payments.reduce(
    (sum, p) => sum + (toJpy(fromMinor(p.amountMinor, p.currency), p.currency, rates) ?? 0),
    0,
  );

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title="支払い履歴" />
      <Card style={{ gap: spacing.xxs }}>
        <AppText variant="footnote" tone="secondary">
          {sub.name}の支払い合計（{payments.length}回）
        </AppText>
        <AppText variant="title" style={styles.amount}>
          {formatMoney(total)}
        </AppText>
      </Card>
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        {payments.length === 0 ? (
          <AppText variant="footnote" tone="secondary" style={{ paddingVertical: spacing.md }}>
            まだ支払いはありません（契約開始日以降の請求日に自動で記録されます）
          </AppText>
        ) : (
          payments.map((p, index) => (
            <PressableScale
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${formatFullDate(p.billedOn)}、${formatMinor(p.amountMinor, p.currency)}${p.isUserEdited ? '、修正済み' : ''}`}
              accessibilityHint="修正・削除できます"
              onPress={() => setEditing(p)}
              scaleTo={0.99}
              style={[styles.row, { gap: spacing.sm, paddingVertical: spacing.sm }]}>
              <AppText variant="body" style={styles.flex}>
                {formatFullDate(p.billedOn)}
              </AppText>
              {p.isUserEdited ? <Badge label="修正済み" tone="neutral" /> : null}
              <AppText variant="callout">{formatMinor(p.amountMinor, p.currency)}</AppText>
              {index < payments.length - 1 ? (
                <View
                  style={[
                    styles.separator,
                    { height: sizes.hairline, backgroundColor: colors.hairline },
                  ]}
                />
              ) : null}
            </PressableScale>
          ))
        )}
      </Card>
      <AppText variant="caption" tone="tertiary">
        契約開始日から今日までの請求日（直近{PAYMENT_HISTORY_WINDOW_MONTHS}
        か月）を、その時点の料金で自動的に記録しています。実際の請求と違う場合はタップして修正してください。
      </AppText>
      <EditPaymentSheet payment={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  amount: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  separator: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
