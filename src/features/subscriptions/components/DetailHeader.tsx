import { MenuView } from '@expo/ui/community/menu';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon, IconButton } from '@/components/ui';
import type { Subscription } from '@/domain/types';
import { ja } from '@/i18n/ja';
import { useCategories } from '@/features/categories/store';
import { useTheme, withAlpha } from '@/theme';

import { brandColorOf, ServiceIcon } from './ServiceIcon';

export type DetailMenuAction = { id: string; title: string; destructive?: boolean };

type Props = {
  subscription: Subscription;
  menuActions: DetailMenuAction[];
  onMenuAction: (id: string) => void;
};

const HEADER_HEIGHT = 300;

/**
 * 詳細画面のヘッダー。紺〜スレートの地に、ブランドカラーをぼかした光を淡く重ねる
 * （他社のコンテンツ画像は使わない）。下端は背景色に溶かす。
 */
export function DetailHeader({ subscription: sub, menuActions, onMenuAction }: Props) {
  const { colors, spacing, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const height = HEADER_HEIGHT + insets.top;
  const categories = useCategories();
  const brand = brandColorOf(sub, categories) ?? colors.textTertiary;

  return (
    <View style={{ height }}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.headerBase }]}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 360" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="brandGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={brand} stopOpacity={0.3} />
              <Stop offset="1" stopColor={brand} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={200} cy={150} rx={240} ry={170} fill="url(#brandGlow)" />
        </Svg>
        <LinearGradient
          colors={[
            withAlpha(colors.headerBase, 0),
            withAlpha(colors.headerBase, 0.6),
            colors.background,
          ]}
          locations={[0, 0.62, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View
        style={[
          styles.toolbar,
          { paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.screen },
        ]}>
        <IconButton
          icon="chevron.left"
          fallback="chevron-back"
          variant="glass"
          size={40}
          accessibilityLabel={ja.common.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <MenuView
          actions={menuActions.map((a) => ({
            id: a.id,
            title: a.title,
            attributes: a.destructive ? { destructive: true } : undefined,
          }))}
          colorScheme={scheme}
          onPressAction={({ nativeEvent }) => onMenuAction(nativeEvent.event)}>
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={ja.common.more}
            style={[styles.more, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <Icon
              name="ellipsis"
              fallback="ellipsis-horizontal"
              size={17}
              color={colors.onAccent}
              weight="bold"
            />
          </View>
        </MenuView>
      </View>

      <View style={[styles.identity, { gap: spacing.xxs }]}>
        <ServiceIcon subscription={sub} size={72} />
        <AppText
          variant="largeTitle"
          numberOfLines={1}
          accessibilityRole="header"
          style={[styles.name, { color: colors.onAccent, marginTop: spacing.sm }]}>
          {sub.name}
        </AppText>
        {sub.planName ? (
          <AppText
            variant="footnote"
            numberOfLines={1}
            style={{ color: colors.onAccent, opacity: 0.75 }}>
            {sub.planName}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  more: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  identity: { alignItems: 'center', marginTop: 8, paddingHorizontal: 32 },
  name: { fontWeight: '700' },
});
