import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView, type SymbolViewProps, type SymbolWeight } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { iconFallbacks } from './iconFallbacks';

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
    const ionicon = fallback ?? iconFallbacks[name];
    return ionicon ? (
      <Ionicons name={ionicon} size={size} color={color} style={style} />
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
