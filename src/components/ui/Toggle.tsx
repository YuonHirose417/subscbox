import * as Haptics from 'expo-haptics';
import { Switch } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
};

/** iOS 標準 Switch。trackColor にアクセントを使う */
export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: Props) {
  const { accent, colors } = useTheme();
  return (
    <Switch
      value={value}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: accent.control, false: colors.surfaceSecondary }}
      ios_backgroundColor={colors.surfaceSecondary}
      onValueChange={(next) => {
        Haptics.selectionAsync().catch(() => {});
        onValueChange(next);
      }}
    />
  );
}
