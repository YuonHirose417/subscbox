import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { AppText, Icon } from '@/components/ui';
import { useTheme } from '@/theme';

type Props = {
  children: ReactNode;
  /** 削除ボタンが押されたとき（確認ダイアログは呼び出し側で出す） */
  onDelete: () => void;
};

const ACTION_WIDTH = 84;

/** 左スワイプで「削除」ボタンを出す */
export function SwipeToDelete({ children, onDelete }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <Swipeable
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      onSwipeableWillOpen={() => Haptics.selectionAsync().catch(() => {})}
      renderRightActions={(_progress, _translation, methods) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="削除"
          onPress={() => {
            methods.close();
            onDelete();
          }}
          style={[
            styles.action,
            { backgroundColor: colors.negative, gap: spacing.xxs, width: ACTION_WIDTH },
          ]}>
          <Icon name="trash" fallback="trash-outline" size={18} color={colors.onAccent} />
          <AppText variant="caption" style={{ color: colors.onAccent }}>
            削除
          </AppText>
        </Pressable>
      )}>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', justifyContent: 'center' },
});
