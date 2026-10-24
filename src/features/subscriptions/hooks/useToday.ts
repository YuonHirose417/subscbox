import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { today as todayString } from '@/domain/dates';
import { useClockStore } from '@/utils/clock';

/** 今日の日付。フォアグラウンド復帰時に更新する（日付をまたいだ場合に残り日数を直す） */
export function useToday(): string {
  // 開発用の日付の偽装を変えたときも再描画する
  useClockStore((s) => s.offsetDays);
  const [, setTick] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setTick((n) => n + 1);
    });
    return () => sub.remove();
  }, []);
  return todayString();
}
