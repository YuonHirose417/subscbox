import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme';

import { useEntranceProgress } from './useEntranceProgress';

export type DonutSegment = { value: number; color: string; label: string };

type Props = {
  segments: readonly DonutSegment[];
  size?: number;
  /** リングの太さ（既定 size の 17%） */
  thickness?: number;
  /** 中央に置く要素（「合計 ¥12,340 /月」など） */
  center?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * カテゴリ別ドーナツ。初回表示で弧を 0 → 値へ 600ms で描き、
 * データが変わったときはクロスフェードする。データ整形はしない。
 */
export function DonutChart({
  segments,
  size = 160,
  thickness,
  center,
  accessibilityLabel,
  style,
}: Props) {
  const { colors, motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const stroke = thickness ?? Math.round(size * 0.17);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  const progress = useEntranceProgress(motion.chartDuration);
  const opacity = useSharedValue(1);
  const dataKey = segments.map((s) => `${s.label}:${Math.round(s.value)}`).join('|');

  useEffect(() => {
    if (reducedMotion) return;
    opacity.set(0.35);
    opacity.set(withTiming(1, { duration: motion.duration, easing: motion.easing }));
  }, [dataKey, opacity, reducedMotion, motion]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  const visible = segments.filter((s) => s.value > 0);
  const lengths = visible.map((s) => (total > 0 ? (s.value / total) * circumference : 0));
  const arcs = visible.map((segment, i) => ({
    segment,
    length: lengths[i],
    start: lengths.slice(0, i).reduce((sum, l) => sum + l, 0),
  }));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height: size }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surfaceSecondary}
            strokeWidth={stroke}
            fill="none"
          />
          {arcs.map(({ segment, start, length }) => (
            <Arc
              key={segment.label}
              color={segment.color}
              start={start}
              length={length}
              size={size}
              radius={radius}
              stroke={stroke}
              circumference={circumference}
              progress={progress}
            />
          ))}
        </Svg>
      </Animated.View>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        {center}
      </View>
    </View>
  );
}

type ArcProps = {
  color: string;
  start: number;
  length: number;
  size: number;
  radius: number;
  stroke: number;
  circumference: number;
  progress: number;
};

function Arc({ color, start, length, size, radius, stroke, circumference, progress }: ArcProps) {
  const drawn = progress * circumference;
  const visible = Math.min(length, Math.max(0, drawn - start));
  if (visible <= 0) return null;

  return (
    <Circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      stroke={color}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="butt"
      transform={`rotate(-90 ${size / 2} ${size / 2})`}
      strokeDasharray={[visible, circumference]}
      strokeDashoffset={-start}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
