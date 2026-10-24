import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { lighten, useTheme } from '@/theme';

import { useEntranceProgress } from './useEntranceProgress';

export type DonutSegment = { value: number; color: string; label: string };

type Props = {
  segments: readonly DonutSegment[];
  size?: number;
  /** リングの太さ（既定 size の 15%。カンプ実測 166pt / 25pt） */
  thickness?: number;
  /** 中央に置く要素（「合計 ¥12,340 /月」など） */
  center?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** 区分の間の隙間（カンプ実測 約2pt） */
const SEGMENT_GAP = 2;

/**
 * カテゴリ別ドーナツ。各区分は明るい側→元の色の濃淡グラデーションで塗り、外周に弱い発光を付ける。
 * 初回表示で弧を 0 → 値へ 600ms で描き、
 * データが変わったときはクロスフェードする。データ整形はしない。
 */
export function DonutChart({
  segments,
  size = 164,
  thickness,
  center,
  accessibilityLabel,
  style,
}: Props) {
  const { colors, accent, motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const stroke = thickness ?? Math.round(size * 0.15);
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
      {total > 0 ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2, boxShadow: accent.glow }]}
        />
      ) : null}
      <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
        <Svg width={size} height={size}>
          <Defs>
            {arcs.map(({ segment, start, length }, i) => {
              const from = pointAt(size, radius, start);
              const to = pointAt(size, radius, start + length);
              return (
                <LinearGradient
                  key={segment.label}
                  id={`donut${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}>
                  <Stop offset="0" stopColor={lighten(segment.color, 0.35)} />
                  <Stop offset="1" stopColor={segment.color} />
                </LinearGradient>
              );
            })}
          </Defs>
          {total === 0 ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.surfaceSecondary}
              strokeWidth={stroke}
              fill="none"
            />
          ) : null}
          {arcs.map(({ segment, start, length }, i) => (
            <Arc
              key={segment.label}
              gap={arcs.length > 1 ? SEGMENT_GAP : 0}
              color={`url(#donut${i})`}
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

/** 弧の長さ（3時の位置から時計回り。回転前の座標）の位置 */
function pointAt(size: number, radius: number, arcLength: number) {
  const angle = arcLength / radius;
  return { x: size / 2 + radius * Math.cos(angle), y: size / 2 + radius * Math.sin(angle) };
}

type ArcProps = {
  color: string;
  gap: number;
  start: number;
  length: number;
  size: number;
  radius: number;
  stroke: number;
  circumference: number;
  progress: number;
};

function Arc({
  color,
  gap,
  start,
  length,
  size,
  radius,
  stroke,
  circumference,
  progress,
}: ArcProps) {
  const drawn = progress * circumference;
  const visible = Math.min(length - gap, Math.max(0, drawn - start));
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
