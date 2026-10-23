import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

type Props = {
  title: string;
  /** close=×（モーダルを閉じる）、back=‹（モーダル内で戻る） */
  leading: 'close' | 'back';
  onLeadingPress: () => void;
};

/** 追加モーダルのヘッダー（カンプ：左に×、中央にタイトル） */
export function ModalHeader({ title, leading, onLeadingPress }: Props) {
  const { spacing, colors, sizes } = useTheme();
  return (
    <View style={[styles.row, { paddingTop: spacing.md, paddingBottom: spacing.xs }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={leading === 'close' ? ja.common.close : ja.common.back}
        onPress={onLeadingPress}
        style={{ width: sizes.touchTarget, height: sizes.touchTarget, justifyContent: 'center' }}>
        <Icon
          name={leading === 'close' ? 'xmark' : 'chevron.left'}
          fallback={leading === 'close' ? 'close' : 'chevron-back'}
          size={20}
          color={colors.textPrimary}
          weight="medium"
        />
      </Pressable>
      <AppText variant="title" accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      <View style={{ width: sizes.touchTarget }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center' },
});
