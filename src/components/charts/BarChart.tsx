import { LinearGradient as ViewGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';

import { formatTick, niceTicks } from './scale';
import { easeOutCubic, useAnimationClock } from './useEntranceProgress';

export type Bar = { key: string; label: string; value: number };

type Props = {
  bars: readonly Bar[];
  /** 濃いグラデーション＋吹き出しで強調する棒（当月） */
  highlightIndex?: number;
  formatValue: (value: number) => string;
  onPressBar?: (index: number) => void;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const AXIS_WIDTH = 44;
const LABEL_HEIGHT = 22;
const BUBBLE_HEIGHT = 26;
const GROW_MS = 600;

/** 上端だけ角丸の棒 */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

/**
 * 月別の棒グラフ。下から伸びる（各棒 30ms ずつ遅延）。強調する棒は濃いグラデーションと
 * 値の吹き出し、それ以外は淡いブルー〜パープル。データ整形はしない。
 */
export function BarChart({
  bars,
  highlightIndex,
  formatValue,
  onPressBar,
  height = 200,
  style,
}: Props) {
  const { colors, accent, motion } = useTheme();
  const [width, setWidth] = useState(0);
  const total = GROW_MS + bars.length * motion.barStagger;
  const t = useAnimationClock(total);

  const ticks = niceTicks(Math.max(0, ...bars.map((b) => b.value)));
  const top = ticks[ticks.length - 1];
  const plotTop = BUBBLE_HEIGHT + 8;
  const plotHeight = height - plotTop - LABEL_HEIGHT;
  const plotWidth = Math.max(0, width - AXIS_WIDTH);
  const slot = bars.length > 0 ? plotWidth / bars.length : 0;
  const barWidth = Math.min(26, slot * 0.52);
  const yOf = (v: number) => plotTop + plotHeight - (top > 0 ? (v / top) * plotHeight : 0);

  const grown = (i: number) =>
    easeOutCubic(Math.min(1, Math.max(0, (t * total - i * motion.barStagger) / GROW_MS)));

  const highlighted = highlightIndex !== undefined ? bars[highlightIndex] : undefined;
  const hx = highlightIndex !== undefined ? AXIS_WIDTH + slot * highlightIndex + slot / 2 : 0;
  const hy = highlighted ? yOf(highlighted.value * grown(highlightIndex!)) : 0;

  return (
    <View style={[{ height }, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="barMuted" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent.gradientMuted[1]} />
              <Stop offset="1" stopColor={accent.gradientMuted[0]} />
            </LinearGradient>
            <LinearGradient id="barHighlight" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent.gradient[1]} />
              <Stop offset="1" stopColor={accent.gradient[0]} />
            </LinearGradient>
          </Defs>
          {ticks.map((tick) => (
            <Line
              key={tick}
              x1={AXIS_WIDTH}
              x2={width}
              y1={yOf(tick)}
              y2={yOf(tick)}
              stroke={colors.hairline}
              strokeWidth={tick === 0 ? 1 : 0.5}
            />
          ))}
          {bars.map((bar, i) => {
            const h = (top > 0 ? (bar.value / top) * plotHeight : 0) * grown(i);
            const x = AXIS_WIDTH + slot * i + (slot - barWidth) / 2;
            return (
              <Path
                key={bar.key}
                d={barPath(x, plotTop + plotHeight - h, barWidth, h, 7)}
                fill={i === highlightIndex ? 'url(#barHighlight)' : 'url(#barMuted)'}
              />
            );
          })}
        </Svg>
      ) : null}

      {/* Y軸ラベル */}
      {width > 0
        ? ticks.map((tick) => (
            <AppText
              key={tick}
              variant="caption"
              tone="tertiary"
              style={[styles.tick, { top: yOf(tick) - 7, width: AXIS_WIDTH - 8 }]}>
              {formatTick(tick)}
            </AppText>
          ))
        : null}

      {/* X軸ラベル */}
      {width > 0
        ? bars.map((bar, i) => (
            <AppText
              key={bar.key}
              variant="caption"
              tone={i === highlightIndex ? 'primary' : 'tertiary'}
              numberOfLines={1}
              style={[
                styles.xLabel,
                { left: AXIS_WIDTH + slot * i, width: slot, top: plotTop + plotHeight + 6 },
              ]}>
              {bar.label}
            </AppText>
          ))
        : null}

      {/* 強調する棒の吹き出し */}
      {highlighted && width > 0 && highlighted.value > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.bubbleWrap, { left: hx - 60, top: Math.max(0, hy - BUBBLE_HEIGHT - 6) }]}>
          <View style={styles.bubble}>
            <ViewGradient
              colors={accent.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <AppText variant="caption" style={{ color: colors.onAccent, fontWeight: '700' }}>
              {formatValue(highlighted.value)}
            </AppText>
          </View>
        </View>
      ) : null}

      {/* タップ領域（各月の列） */}
      {width > 0
        ? bars.map((bar, i) => (
            <Pressable
              key={bar.key}
              accessibilityRole="button"
              accessibilityLabel={`${bar.label}、${formatValue(bar.value)}`}
              accessibilityHint={onPressBar ? '内訳を表示します' : undefined}
              disabled={!onPressBar}
              onPress={() => onPressBar?.(i)}
              style={[styles.hit, { left: AXIS_WIDTH + slot * i, width: slot, height }]}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tick: { position: 'absolute', left: 0, textAlign: 'right', fontVariant: ['tabular-nums'] },
  xLabel: { position: 'absolute', textAlign: 'center' },
  bubbleWrap: { position: 'absolute', width: 120, alignItems: 'center' },
  bubble: {
    height: BUBBLE_HEIGHT,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hit: { position: 'absolute', top: 0 },
});
