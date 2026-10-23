import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon } from './Icon';

type Props = {
  title?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** 技術的なエラー内容は表示しない（詳細は logger に出す） */
export function ErrorState({ title = ja.error.loadTitle, onRetry, style }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.root, { gap: spacing.sm, paddingVertical: spacing.xxxl }, style]}>
      <Icon
        name="exclamationmark.triangle"
        fallback="warning-outline"
        size={40}
        color={colors.warning}
      />
      <AppText variant="headline" style={styles.center}>
        {title}
      </AppText>
      {onRetry ? (
        <Button
          title={ja.common.retry}
          variant="secondary"
          size="sm"
          onPress={onRetry}
          style={{ marginTop: spacing.xs, minWidth: 140 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
