import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView, type SymbolViewProps, type SymbolWeight } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

export type IconName = Extract<SymbolViewProps['name'], string>;
type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  /** SF Symbol 名（iOS） */
  name: IconName;
  /** iOS 以外で使う @expo/vector-icons（Ionicons）名 */
  fallback?: IoniconName;
  size?: number;
  color: string;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, fallback, size = 20, color, weight = 'regular', style }: Props) {
  if (Platform.OS !== 'ios') {
    return fallback ? (
      <Ionicons name={fallback} size={size} color={color} style={style} />
    ) : (
      <View style={[{ width: size, height: size }, style]} />
    );
  }
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      style={[{ width: size, height: size }, style]}
    />
  );
}
