import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { HeroBlobs } from './HeroBlobs';

type Props = {
  children: ReactNode;
  /** 縦スクロールさせるか（既定 true） */
  scroll?: boolean;
  /** 画面上部の右側に、青・ラベンダー・ピンクの柔らかい色の塊を敷く（ホーム） */
  tint?: boolean;
  /** 左右余白（既定 20）を付けるか */
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'children'>;
  /** 上のセーフエリア分の余白（モーダル・シート内では false） */
  topInset?: boolean;
};

export function Screen({
  children,
  scroll = true,
  tint = false,
  padded = true,
  contentStyle,
  scrollProps,
  topInset = true,
}: Props) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const inner: StyleProp<ViewStyle> = [
    {
      paddingTop: (topInset ? insets.top : 0) + spacing.xs,
      paddingBottom: insets.bottom + spacing.xxl,
      paddingHorizontal: padded ? spacing.screen : 0,
      gap: spacing.md,
    },
    contentStyle,
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {tint ? <HeroBlobs colors={colors.heroBlobs} /> : null}
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
          contentContainerStyle={inner}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, inner]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
