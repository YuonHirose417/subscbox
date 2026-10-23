import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ icon, title, description, actionLabel, onAction, style }: Props) {
  const { accent, spacing, colors } = useTheme();
  return (
    <View style={[styles.root, { gap: spacing.sm, paddingVertical: spacing.xxxl }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.infoSoft }]}>
        <Icon name={icon} fallback="albums-outline" size={44} color={accent.secondary} />
      </View>
      <AppText variant="headline" style={styles.center} accessibilityRole="header">
        {title}
      </AppText>
      {description ? (
        <AppText variant="body" tone="secondary" style={styles.center}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={{ marginTop: spacing.xs, alignSelf: 'stretch' }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', paddingHorizontal: 12 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  center: { textAlign: 'center' },
});
