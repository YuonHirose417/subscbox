import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon, Screen, Skeleton } from '@/components/ui';
import { PRIVACY_POLICY_URL, TERMS_URL } from '@/constants/app';
import { FREE_LIMITS } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/usePremium';
import { ModalHeader } from '@/features/subscriptions/components/ModalHeader';
import { premiumService, type PremiumOffering } from '@/services/premium';
import { useTheme } from '@/theme';
import { logger } from '@/utils/logger';

const FEATURES = [
  '広告を表示しない',
  `サブスクの登録数が無制限（無料版は${FREE_LIMITS.subscriptions}件まで）`,
  `自作カテゴリが無制限（無料版は${FREE_LIMITS.customCategories}件まで）`,
  `支払い方法の登録が無制限（無料版は${FREE_LIMITS.paymentMethods}件まで）`,
  'サブスクごとの通知のオン／オフとタイミング',
  '支払い履歴と支払いカレンダー',
  'CSVの書き出し',
  '一覧の並び替え',
  'テーマカラーの変更',
  'アイコンに好きな写真を設定',
] as const;

type OfferState =
  { kind: 'loading' } | { kind: 'ready'; offer: PremiumOffering } | { kind: 'error' };

/** プレミアムプラン（買い切り）。価格は RevenueCat の Offering のローカライズ済み文字列をそのまま表示する */
export default function PaywallScreen() {
  const { spacing, colors, accent, radius } = useTheme();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const { isPremium } = usePremium();
  const [state, setState] = useState<OfferState>({ kind: 'loading' });
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);

  // 失敗時は「ストアに接続できませんでした」と再試行ボタンを出す
  const fetchOffer = useCallback(
    () =>
      premiumService
        .getOfferings()
        .then((offers): OfferState => {
          const offer = offers.find((o) => o.period === 'lifetime') ?? offers[0];
          return offer ? { kind: 'ready', offer } : { kind: 'error' };
        })
        .catch((error): OfferState => {
          logger.error('failed to load offerings', error);
          return { kind: 'error' };
        }),
    [],
  );

  useEffect(() => {
    let alive = true;
    fetchOffer().then((next) => {
      if (alive) setState(next);
    });
    return () => {
      alive = false;
    };
  }, [fetchOffer]);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchOffer().then(setState);
  };

  const purchase = async (offer: PremiumOffering) => {
    setBusy('purchase');
    try {
      const result = await premiumService.purchase(offer.packageId);
      if (result.status === 'success' && result.isPremium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert(
          'ありがとうございます',
          'プレミアムプランのすべての機能が使えるようになりました。',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } else if (result.status === 'pending') {
        Alert.alert(
          '承認待ちです',
          '購入の承認（ファミリー共有の「承認と購入のリクエスト」など）が済むと、自動でプレミアムになります。',
        );
      } else if (result.status === 'error') {
        Alert.alert('購入できませんでした', result.message);
      }
      // cancelled のときは何も出さない
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy('restore');
    try {
      const result = await premiumService.restore();
      Alert.alert(
        result.isPremium ? '購入を復元しました' : '復元できる購入はありませんでした',
        result.isPremium
          ? 'プレミアムプランの機能が使えます。'
          : '購入したときと同じ Apple ID でサインインしているかご確認ください。',
      );
    } catch (error) {
      logger.error('restore failed', error);
      Alert.alert(
        '復元できませんでした',
        'インターネットに接続できているか確認して、もう一度お試しください。',
      );
    } finally {
      setBusy(null);
    }
  };

  const openLink = (url: string) =>
    WebBrowser.openBrowserAsync(url).catch((error) => logger.error('open link failed', error));

  return (
    <Screen topInset={false} contentStyle={{ gap: spacing.md }}>
      <ModalHeader title="プレミアムプラン" leading="close" onLeadingPress={() => router.back()} />

      {reason && !isPremium ? (
        <Card style={[styles.row, { gap: spacing.sm, backgroundColor: colors.infoSoft }]}>
          <Icon name="info.circle" size={18} color={colors.infoText} />
          <AppText variant="footnote" style={[styles.flex, { color: colors.infoText }]}>
            {reason}
          </AppText>
        </Card>
      ) : null}

      <View style={[styles.hero, { gap: spacing.xs }]}>
        <View style={[styles.badge, { borderRadius: radius.pill }]}>
          <LinearGradient
            colors={accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="crown" size={30} color={colors.onAccent} weight="semibold" />
        </View>
        <AppText variant="title" style={styles.heroTitle}>
          一度の購入で、ずっと使える
        </AppText>
        <AppText variant="footnote" tone="secondary" style={styles.center}>
          買い切りなので、毎月の支払いはありません
        </AppText>
      </View>

      <Card style={{ gap: spacing.sm }}>
        {FEATURES.map((f) => (
          <View key={f} style={[styles.row, { gap: spacing.sm }]}>
            <Icon name="checkmark.circle.fill" size={18} color={accent.primary} />
            <AppText variant="body" style={styles.flex}>
              {f}
            </AppText>
          </View>
        ))}
      </Card>

      {isPremium ? (
        <Card style={{ alignItems: 'center', gap: spacing.xxs }}>
          <AppText variant="headline">プレミアムプランをご利用中です</AppText>
          <AppText variant="footnote" tone="secondary" style={styles.center}>
            ご購入ありがとうございます。すべての機能が使えます。
          </AppText>
        </Card>
      ) : state.kind === 'loading' ? (
        <Skeleton height={56} radius={radius.buttonLarge} />
      ) : state.kind === 'error' ? (
        <Card style={{ alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="footnote" tone="secondary" style={styles.center}>
            ストアに接続できませんでした。通信環境を確認して、もう一度お試しください。
          </AppText>
          <Button title="再試行" variant="secondary" size="sm" onPress={retry} />
        </Card>
      ) : (
        <Button
          title={`${state.offer.priceString}で購入する（買い切り）`}
          loading={busy === 'purchase'}
          disabled={busy !== null}
          onPress={() => purchase(state.offer)}
        />
      )}

      <Button
        title="購入を復元"
        variant="secondary"
        loading={busy === 'restore'}
        disabled={busy !== null}
        onPress={restore}
      />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="tertiary">
          買い切り（1回のみのお支払い）です。自動更新や定期的な請求はありません。お支払いは購入の確定時に
          Apple ID に請求されます。購入は同じ Apple ID の端末で「購入を復元」から引き継げます。
        </AppText>
        <View style={[styles.row, styles.links, { gap: spacing.md }]}>
          <AppText
            variant="caption"
            tone="accent"
            accessibilityRole="link"
            onPress={() => openLink(TERMS_URL)}>
            利用規約
          </AppText>
          <AppText
            variant="caption"
            tone="accent"
            accessibilityRole="link"
            onPress={() => openLink(PRIVACY_POLICY_URL)}>
            プライバシーポリシー
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  hero: { alignItems: 'center' },
  heroTitle: { fontWeight: '700', textAlign: 'center' },
  badge: {
    width: 64,
    height: 64,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  links: { justifyContent: 'center' },
});
