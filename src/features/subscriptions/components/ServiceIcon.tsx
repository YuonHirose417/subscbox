import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { popularServicesByKey } from '@/data/popularServices';
import { serviceLogos } from '@/data/serviceLogos';
import type { Category, Subscription } from '@/domain/types';
import { useCategories } from '@/features/categories/store';
import { useTheme } from '@/theme';

import { iconImageUri } from '../iconImages';

type Props = {
  subscription: Pick<Subscription, 'serviceKey' | 'name' | 'icon' | 'categoryId'>;
  size?: number;
};

/**
 * サービスのアイコン。カスタム画像（プレミアム）→ assets/service-logos/<serviceKey>.png のロゴ →
 * 白いタイル＋ブランドカラー（カスタムはカテゴリカラー）の頭文字＋淡い影、の順に使う。
 */
export function ServiceIcon({ subscription, size }: Props) {
  const { sizes, radius, colors, shadow, scheme } = useTheme();
  const categories = useCategories();
  const dimension = size ?? sizes.serviceIcon;
  const corner = Math.round((radius.icon / sizes.serviceIcon) * dimension);
  const { serviceKey, name, icon } = subscription;
  const logo = serviceKey ? serviceLogos[serviceKey] : undefined;
  const frame = {
    width: dimension,
    height: dimension,
    borderRadius: corner,
    borderCurve: 'continuous' as const,
  };

  // カスタム画像（プレミアム）。ファイルが無い場合（バックアップから復元した等）はロゴ・頭文字にする
  const imageUri = icon.type === 'image' ? iconImageUri(icon.value) : null;
  if (imageUri) {
    return (
      <View style={[styles.frame, frame, { borderColor: colors.border }]}>
        <Image
          source={{ uri: imageUri }}
          style={frame}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  if (logo) {
    return (
      <View
        style={[
          styles.frame,
          frame,
          { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: shadow },
        ]}>
        <Image source={logo} style={frame} contentFit="cover" accessibilityIgnoresInvertColors />
      </View>
    );
  }

  const brand = brandColorOf(subscription, categories) ?? colors.textTertiary;
  const preset = serviceKey ? popularServicesByKey[serviceKey] : undefined;
  // ダークは暗いタイル。黒に近いブランド色はそのままだと沈むので文字色に置き換える
  const letterColor = scheme === 'dark' && luminance(brand) < 0.08 ? colors.textPrimary : brand;
  const letter =
    (icon.type === 'monogram' ? icon.value : null) ?? preset?.monogram ?? initialOf(name);

  return (
    <View
      style={[
        styles.frame,
        styles.center,
        frame,
        {
          backgroundColor: scheme === 'dark' ? colors.surfaceSecondary : colors.surface,
          borderColor: colors.border,
          boxShadow: shadow,
          overflow: 'visible',
        },
      ]}>
      <AppText
        allowFontScaling={false}
        style={{
          color: letterColor,
          fontSize: Math.round(dimension * (letter.length > 1 ? 0.34 : 0.46)),
          fontWeight: '700',
        }}>
        {letter}
      </AppText>
    </View>
  );
}

/** サービスのブランドカラー（カスタムはカテゴリカラー）。詳細画面ヘッダーの光にも使う */
export function brandColorOf(
  subscription: Pick<Subscription, 'serviceKey' | 'icon' | 'categoryId'>,
  categories: readonly Category[],
): string | undefined {
  const preset = subscription.serviceKey
    ? popularServicesByKey[subscription.serviceKey]
    : undefined;
  return (
    subscription.icon.color ??
    preset?.brandColor ??
    categories.find((c) => c.id === subscription.categoryId)?.color
  );
}

/** '#RRGGBB' の相対輝度（0〜1） */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1, 7), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function initialOf(name: string): string {
  const first = [...name.trim()][0] ?? '?';
  return first.toUpperCase();
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
