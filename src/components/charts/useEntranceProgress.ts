import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

/**
 * 初回表示時に 0 → 1 へ進む値（easeOutCubic）。「視差効果を減らす」がオンなら最初から 1。
 * SVG の破線パターン（配列）は Reanimated の animatedProps で安定して更新できないため、
 * 短いグラフのアニメーションは JS のフレーム更新で行う。
 */
export function useEntranceProgress(duration: number): number {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    const startedAt = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      setProgress(1 - (1 - t) ** 3);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, reducedMotion]);

  return reducedMotion ? 1 : progress;
}
