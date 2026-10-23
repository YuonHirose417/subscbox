import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 右上のボタン文言（既定「完了」） */
  closeLabel?: string;
};

/** iOS 標準のページシート（下から出て、下にスワイプで閉じる） */
export function Sheet({ visible, title, onClose, children, closeLabel = '完了' }: Props) {
  const { colors, spacing, accent } = useTheme();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingHorizontal: spacing.screen, paddingVertical: spacing.md },
          ]}>
          <View style={styles.side} />
          <AppText variant="headline" accessibilityRole="header" style={styles.title}>
            {title}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            hitSlop={12}
            onPress={onClose}
            style={[styles.side, styles.close]}>
            <AppText variant="headline" style={{ color: accent.primary }}>
              {closeLabel}
            </AppText>
          </Pressable>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: spacing.screen,
            paddingBottom: spacing.xxxl,
            gap: spacing.md,
          }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center' },
  side: { width: 64 },
  close: { alignItems: 'flex-end' },
});
