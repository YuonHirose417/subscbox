import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { popularServicesByKey } from '@/data/popularServices';
import { serviceLogos } from '@/data/serviceLogos';
import type { Subscription } from '@/domain/types';
import { useCategories } from '@/features/categories/store';
import { useTheme } from '@/theme';

type Props = {
  subscription: Pick<Subscription, 'serviceKey' | 'name' | 'icon' | 'categoryId'>;
  size?: number;
};

/**
 * サービスのアイコン。assets/service-logos/<serviceKey>.png があればロゴ、
 * なければブランドカラー（カスタムはカテゴリカラー）＋白の頭文字。
 */
export function ServiceIcon({ subscription, size }: Props) {
  const { sizes, radius, colors, shadow } = useTheme();
  const categories = useCategories();
  const dimension = size ?? sizes.serviceIcon;
  const corner = Math.round((radius.icon / sizes.serviceIcon) * dimension);
  const { serviceKey, name, icon, categoryId } = subscription;
  const logo = serviceKey ? serviceLogos[serviceKey] : undefined;
  const frame = {
    width: dimension,
    height: dimension,
    borderRadius: corner,
    borderCurve: 'continuous' as const,
  };

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

  const preset = serviceKey ? popularServicesByKey[serviceKey] : undefined;
  const category = categories.find((c) => c.id === categoryId);
  const background = icon.color ?? preset?.brandColor ?? category?.color ?? colors.textTertiary;
  const letter =
    (icon.type === 'monogram' ? icon.value : null) ?? preset?.monogram ?? initialOf(name);

  return (
    <View style={[styles.frame, styles.center, frame, { backgroundColor: background }]}>
      <AppText
        allowFontScaling={false}
        style={{
          color: colors.onAccent,
          fontSize: Math.round(dimension * (letter.length > 1 ? 0.34 : 0.46)),
          fontWeight: '700',
        }}>
        {letter}
      </AppText>
    </View>
  );
}

function initialOf(name: string): string {
  const first = [...name.trim()][0] ?? '?';
  return first.toUpperCase();
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
