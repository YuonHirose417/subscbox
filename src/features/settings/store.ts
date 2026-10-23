import { create } from 'zustand';

import type { AccentPresetId } from '@/theme/tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsState = {
  themePreference: ThemePreference;
  /** テーマカラー（プレミアム機能）。無料ユーザーは常に 'default' として扱う */
  accentPreset: AccentPresetId;
  setThemePreference: (value: ThemePreference) => void;
  setAccentPreset: (value: AccentPresetId) => void;
};

// フェーズ5で SQLite の settings テーブルと同期する。現時点ではメモリ保持のみ。
export const useSettingsStore = create<SettingsState>((set) => ({
  themePreference: 'system',
  accentPreset: 'default',
  setThemePreference: (themePreference) => set({ themePreference }),
  setAccentPreset: (accentPreset) => set({ accentPreset }),
}));
