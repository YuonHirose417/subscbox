import { LinearGradient } from 'expo-linear-gradient';
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

type Props = {
  children: ReactNode;
  /** 縦スクロールさせるか（既定 true） */
  scroll?: boolean;
  /** 画面上部の淡いラベンダー〜ピンクのグラデーション（ホーム等） */
  tint?: boolean;
  /** 左右余白（既定 20）を付けるか */
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'children'>;
};

export function Screen({
  children,
  scroll = true,
  tint = false,
  padded = true,
  contentStyle,
  scrollProps,
}: Props) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const inner: StyleProp<ViewStyle> = [
    {
      paddingTop: insets.top + spacing.xs,
      paddingBottom: insets.bottom + spacing.xxl,
      paddingHorizontal: padded ? spacing.screen : 0,
      gap: spacing.md,
    },
    contentStyle,
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {tint ? (
        <LinearGradient
          pointerEvents="none"
          colors={colors.backgroundTint}
          locations={[0, 0.45, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={styles.tint}
        />
      ) : null}
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
  tint: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
});
