import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  EmptyState,
  Icon,
  PressableScale,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { formatMoney } from '@/domain/money';
import {
  potentialYearlySavings,
  REVIEW_THRESHOLD_DAYS,
  reviewCandidates,
  unusedLabel,
} from '@/domain/review';
import { useSettingsStore } from '@/features/settings/store';
import { ServiceIcon } from '@/features/subscriptions/components/ServiceIcon';
import { useToday } from '@/features/subscriptions/hooks/useToday';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { useTheme, withAlpha } from '@/theme';

/** 使っていない可能性のあるサブスク（ユーザーが記録した最終利用日から判定） */
export default function ReviewScreen() {
  const { spacing, colors, accent, radius, sizes } = useTheme();
  const today = useToday();
  const items = useSubscriptionStore((s) => s.items);
  const rates = useSettingsStore((s) => s.exchangeRates);
  const candidates = reviewCandidates(items, today);
  const savings = potentialYearlySavings(candidates, rates);

  const explainSavings = () =>
    Alert.alert(
      '節約額の目安',
      `上のサブスクをすべて解約した場合の、1年間の支払い額（月額換算×12）です。${
        savings.excluded > 0
          ? `為替レートが未設定の外貨のサブスク（${savings.excluded}件）は含みません。`
          : ''
      }`,
    );

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <ScreenHeader showBack title="使っていない可能性のあるサブスク" />
      {candidates.length === 0 ? (
        <EmptyState
          icon="hourglass"
          title="見直し候補はありません"
          description={`サブスクの詳細画面で「最終利用日」を記録すると、${REVIEW_THRESHOLD_DAYS}日以上使っていないサブスクがここに表示されます。`}
        />
      ) : (
        <>
          <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
            {candidates.map(({ subscription: sub, daysUnused }, index) => (
              <PressableScale
                key={sub.id}
                accessibilityRole="button"
                accessibilityLabel={`${sub.name}、${unusedLabel(daysUnused)}`}
                accessibilityHint="詳細を開きます"
                scaleTo={0.98}
                onPress={() =>
                  router.push({ pathname: '/subscription/[id]', params: { id: sub.id } })
                }
                // 行の間隔はカンプ実測 68pt
                style={[styles.row, { gap: spacing.sm, paddingVertical: 6 }]}>
                <ServiceIcon subscription={sub} />
                <View style={styles.flex}>
                  <AppText variant="rowTitle" numberOfLines={1}>
                    {sub.name}
                  </AppText>
                  <AppText variant="footnote" tone="negative" numberOfLines={1}>
                    {unusedLabel(daysUnused)}
                  </AppText>
                  <AppText variant="footnote" tone="secondary" numberOfLines={1}>
                    最近使っていない可能性があります。
                  </AppText>
                </View>
                <Icon
                  name="chevron.right"
                  fallback="chevron-forward"
                  size={14}
                  color={colors.textTertiary}
                />
                {index < candidates.length - 1 ? (
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
            ))}
          </Card>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`解約すると年間 約${formatMoney(savings.amount)}の節約になる可能性があります`}
            accessibilityHint="計算方法を表示します"
            onPress={explainSavings}
            style={[styles.savings, { borderRadius: radius.inner }]}>
            <LinearGradient
              colors={[withAlpha(colors.negative, 0.13), withAlpha(accent.secondary, 0.16)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.row,
                { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
              ]}>
              <Icon name="lightbulb.fill" fallback="bulb" size={24} color={colors.warning} />
              <AppText variant="footnote" style={[styles.flex, styles.strong]}>
                解約すると年間 約{formatMoney(savings.amount)}の{'\n'}節約になる可能性があります。
              </AppText>
              <Icon
                name="chevron.right"
                fallback="chevron-forward"
                size={14}
                color={colors.textTertiary}
              />
            </View>
          </PressableScale>
          <AppText variant="caption" tone="tertiary">
            最終利用日から{REVIEW_THRESHOLD_DAYS}
            日以上たった契約中のサブスクを表示しています。利用状況は自動では取得しないため、詳細画面の「最終利用日」を記録して使います。
          </AppText>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  strong: { fontWeight: '600' },
  separator: { position: 'absolute', right: 0, bottom: 0 },
  savings: { overflow: 'hidden' },
});
