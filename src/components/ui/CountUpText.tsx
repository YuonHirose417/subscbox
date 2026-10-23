import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { AppText } from './AppText';

type Props = Omit<ComponentProps<typeof AppText>, 'children'> & {
  value: number;
  format: (value: number) => string;
  /** 既定 400ms */
  duration?: number;
};

/** 値が変わったとき数値をカウントアップ／ダウンして表示する（視差効果を減らす場合は即時） */
export function CountUpText({ value, format, duration = 400, ...textProps }: Props) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    if (reducedMotion || from === value) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    let frame = 0;
    const startedAt = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = from + (value - from) * eased;
      fromRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reducedMotion]);

  return (
    <AppText accessibilityLabel={format(value)} {...textProps}>
      {format(display)}
    </AppText>
  );
}
