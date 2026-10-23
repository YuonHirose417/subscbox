import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

/**
 * 初回表示時に 0 → 1 へ一定速度で進む値。「視差効果を減らす」がオンなら最初から 1。
 * SVG の破線パターン（配列）などは Reanimated の animatedProps で安定して更新できないため、
 * 短いグラフのアニメーションは JS のフレーム更新で行う。
 */
export function useAnimationClock(duration: number): number {
  const reducedMotion = useReducedMotion();
  const [t, setT] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    const startedAt = Date.now();
    const tick = () => {
      const next = Math.min(1, (Date.now() - startedAt) / duration);
      setT(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, reducedMotion]);

  return reducedMotion ? 1 : t;
}

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** 初回表示時に 0 → 1 へ進む値（easeOutCubic） */
export function useEntranceProgress(duration: number): number {
  return easeOutCubic(useAnimationClock(duration));
}
