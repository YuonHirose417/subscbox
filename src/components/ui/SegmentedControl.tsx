import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export type SegmentOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

const TRACK_PADDING = 3;

/** ピル型トラック上を、選択中のグラデーションピルが 220ms でスライドする */
export function SegmentedControl<T extends string>({ options, value, onChange, style }: Props<T>) {
  const { colors, accent, radius, motion, sizes } = useTheme();
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const segmentWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / options.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    const target = index * segmentWidth;
    translateX.set(
      reducedMotion
        ? target
        : withTiming(target, { duration: motion.duration, easing: motion.easing }),
    );
  }, [index, segmentWidth, reducedMotion, motion, translateX]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.get() }] }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={[
        styles.track,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.pill,
          padding: TRACK_PADDING,
          minHeight: sizes.segmentHeight,
        },
        style,
      ]}>
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.pill,
            {
              width: segmentWidth,
              top: TRACK_PADDING,
              bottom: TRACK_PADDING,
              left: TRACK_PADDING,
              borderRadius: radius.pill,
              // 選択中のピルにだけ弱い発光
              boxShadow: accent.glow,
            },
            pillStyle,
          ]}>
          <View style={[styles.pillFill, { borderRadius: radius.pill }]}>
            <LinearGradient
              colors={accent.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </Animated.View>
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(option.value);
            }}
            style={styles.segment}>
            <AppText
              variant="label"
              style={{
                fontSize: 13,
                fontWeight: selected ? '700' : '500',
                color: selected ? colors.onAccent : colors.textSecondary,
              }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row' },
  pill: { position: 'absolute' },
  pillFill: { flex: 1, overflow: 'hidden' },
  segment: { flex: 1, minHeight: 30, alignItems: 'center', justifyContent: 'center' },
});
