import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

type Props = {
  title: string;
  /** 左に戻るボタンを出す（push された画面） */
  showBack?: boolean;
  /** 右上のボタン等 */
  trailing?: ReactNode;
  /** 長いタイトル用に一回り小さくする（カンプの「使っていない可能性のあるサブスク」） */
  compact?: boolean;
};

/** largeTitle の画面タイトル。Stack の標準ヘッダーは使わずカンプの見た目で描画する */
export function ScreenHeader({ title, showBack = false, trailing, compact = false }: Props) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {showBack ? (
        <IconButton
          icon="chevron.left"
          fallback="chevron-back"
          accessibilityLabel={ja.common.back}
          size={36}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      ) : null}
      <View style={styles.row}>
        <AppText
          variant={compact ? 'title' : 'largeTitle'}
          accessibilityRole="header"
          style={[styles.title, compact ? styles.compact : null]}>
          {title}
        </AppText>
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
  compact: { fontWeight: '700' },
});
