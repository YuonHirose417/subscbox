import { create } from 'zustand';

type ClockState = {
  /** 開発用の「日付の偽装」（日数）。本番ビルドでは常に 0 */
  offsetDays: number;
};

export const useClockStore = create<ClockState>(() => ({ offsetDays: 0 }));

/** 現在時刻。開発時に日付を偽装していればその分だけずらす（繰り越し・通知計算の確認用） */
export function currentTime(): Date {
  const date = new Date();
  const offset = useClockStore.getState().offsetDays;
  if (offset !== 0) date.setDate(date.getDate() + offset);
  return date;
}

export function setDevDayOffset(days: number): void {
  if (!__DEV__) return;
  useClockStore.setState({ offsetDays: days });
}
