import { create } from 'zustand';

import type { ExchangeRates, SortOrder } from '@/domain/types';
import type { AccentPresetId } from '@/theme/tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsState = {
  themePreference: ThemePreference;
  /** テーマカラー（プレミアム機能）。無料ユーザーは常に 'default' として扱う */
  accentPreset: AccentPresetId;
  /** 一覧の並び替え（プレミアム機能）。無料ユーザーは常に登録順 */
  sortOrder: SortOrder;
  /** 1 外貨 = n 円（ユーザー入力。フェーズ4で設定画面を用意） */
  exchangeRates: ExchangeRates;
  setThemePreference: (value: ThemePreference) => void;
  setAccentPreset: (value: AccentPresetId) => void;
  setSortOrder: (value: SortOrder) => void;
};

// フェーズ5で SQLite の settings テーブルと同期する。現時点ではメモリ保持のみ。
export const useSettingsStore = create<SettingsState>((set) => ({
  themePreference: 'system',
  accentPreset: 'default',
  sortOrder: 'renewal',
  exchangeRates: {},
  setThemePreference: (themePreference) => set({ themePreference }),
  setAccentPreset: (accentPreset) => set({ accentPreset }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
}));
