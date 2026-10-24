import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Icon } from '@/components/ui';
import { useTheme } from '@/theme';

/** 支払い履歴は実際の明細ではなく登録内容からの推定であることを示す注記 */
export function PaymentEstimateNotice() {
  const { spacing, colors } = useTheme();
  return (
    <View style={[styles.row, { gap: spacing.xxs }]}>
      <Icon
        name="info.circle"
        fallback="information-circle-outline"
        size={14}
        color={colors.textTertiary}
      />
      <AppText variant="caption" tone="tertiary" style={styles.flex}>
        登録内容から自動で記録しています。実際の請求額と異なる場合は修正してください
      </AppText>
    </View>
  );
}

/** 自動で記録した行か、ユーザーが修正した行かの印 */
export function PaymentSourceBadge({ isUserEdited }: { isUserEdited: boolean }) {
  return isUserEdited ? (
    <Badge label="修正済み" tone="warning" />
  ) : (
    <Badge label="自動記録" tone="neutral" />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  flex: { flex: 1 },
});
