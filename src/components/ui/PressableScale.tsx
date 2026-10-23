import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion } from '@/theme';

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
    <Pressable
      {...props}
      disabled={disabled}
      onPressIn={(e) => {
        if (!reducedMotion) scale.set(withSpring(scaleTo, motion.spring));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reducedMotion) scale.set(withSpring(1, motion.spring));
        onPressOut?.(e);
      }}>
      {(state) => (
        <Animated.View style={[style, animatedStyle]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
