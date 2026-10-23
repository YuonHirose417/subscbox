import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { today as todayString } from '@/domain/dates';

/** 今日の日付。フォアグラウンド復帰時に更新する（日付をまたいだ場合に残り日数を直す） */
export function useToday(): string {
  const [value, setValue] = useState(todayString);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setValue(todayString());
    });
    return () => sub.remove();
  }, []);
  return value;
}
