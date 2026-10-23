import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, EmptyState, IconButton, Screen } from '@/components/ui';
import { ja } from '@/i18n/ja';

/** サブスクを追加（フェーズ2は仮のモーダル。本実装はフェーズ3） */
export default function AddScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          icon="xmark"
          fallback="close"
          accessibilityLabel={ja.common.close}
          size={36}
          onPress={() => router.back()}
        />
        <AppText variant="headline" accessibilityRole="header" style={styles.title}>
          サブスクを追加
        </AppText>
        <View style={styles.spacer} />
      </View>
      <EmptyState icon="plus.circle" title="追加画面はフェーズ3で実装します" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center' },
  spacer: { width: 36 },
});
