import { MenuView } from '@expo/ui/community/menu';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon, IconButton } from '@/components/ui';
import type { Subscription } from '@/domain/types';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

import { ServiceIcon } from './ServiceIcon';

export type DetailMenuAction = { id: string; title: string; destructive?: boolean };

type Props = {
  subscription: Subscription;
  menuActions: DetailMenuAction[];
  onMenuAction: (id: string) => void;
};

const HEADER_HEIGHT = 300;

/**
 * 詳細画面のヘッダー。サービスアイコンを大きく拡大して強くぼかし、濃紺〜黒の半透明グラデーションを
 * 重ねて暗いトーンの背景を作る（他社のコンテンツ画像は使わない）。下端は背景色に溶かす。
 */
export function DetailHeader({ subscription: sub, menuActions, onMenuAction }: Props) {
  const { colors, spacing, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const height = HEADER_HEIGHT + insets.top;

  return (
    <View style={{ height }}>
      <View
        style={[StyleSheet.absoluteFill, styles.backdrop, { backgroundColor: colors.scrim[1] }]}>
        <View style={styles.bigIcon} importantForAccessibility="no-hide-descendants">
          <ServiceIcon subscription={sub} size={420} />
        </View>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[colors.scrim[0], colors.scrim[1], colors.background]}
          locations={[0, 0.72, 1]}
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
          variant="title"
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
  backdrop: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  bigIcon: { opacity: 0.55, transform: [{ rotate: '-8deg' }] },
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
