import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion } from '@/theme';

// style（幅の % 指定・flex など）を Pressable 自体に当てるため、Pressable をアニメーション対応にする
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** 押下時の縮小率（既定 0.97） */
  scaleTo?: number;
};

/** 押下で scale 0.97 に縮む Pressable。「視差効果を減らす」がオンなら縮小しない */
export function PressableScale({
  style,
  scaleTo = motion.pressScale,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...props
}: Props) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        if (!reducedMotion) scale.set(withSpring(scaleTo, motion.spring));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reducedMotion) scale.set(withSpring(1, motion.spring));
        onPressOut?.(e);
      }}>
      {children}
    </AnimatedPressable>
  );
}
