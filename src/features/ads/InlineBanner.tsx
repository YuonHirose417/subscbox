import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui';
import { usePremium } from '@/features/premium/usePremium';
import { AD_REQUEST_OPTIONS, adsModule, bannerUnitId, useAdsStore } from '@/services/ads';
import { useTheme } from '@/theme';

/**
 * 無料版だけに出すインラインの広告バナー（一覧・分析の末尾）。
 * プレミアム・広告が使えない環境・読み込み失敗（在庫なし等）のときは何も表示しない（空の枠を残さない）。
 * style（周りの余白など）は広告を読み込めたときだけ付ける。読み込み中・失敗時に余白だけが残らないようにするため
 */
export function InlineBanner({ style }: { style?: StyleProp<ViewStyle> }) {
  const { spacing, colors, radius } = useTheme();
  const { isPremium } = usePremium();
  const canRequestAds = useAdsStore((s) => s.canRequestAds);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (isPremium || !canRequestAds || failed || !adsModule || !bannerUnitId) return null;
  const { BannerAd, BannerAdSize } = adsModule;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.inner,
          backgroundColor: colors.surface,
          paddingVertical: loaded ? spacing.xs : 0,
          gap: spacing.xxs,
        },
        loaded ? style : null,
      ]}>
      {loaded ? (
        <AppText variant="caption" tone="tertiary" style={{ paddingHorizontal: spacing.sm }}>
          広告
        </AppText>
      ) : null}
      <BannerAd
        unitId={bannerUnitId}
        size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
        maxHeight={120}
        requestOptions={AD_REQUEST_OPTIONS}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // バナーは読み込みが終わるまで高さ 0 なので、読み込み中に空の枠は見えない
  card: { overflow: 'hidden', alignItems: 'center' },
});
