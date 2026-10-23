import { create } from 'zustand';

import type { SettingsRepository } from '@/db/repositories/SettingsRepository';
import { currencyCodes } from '@/domain/money';
import type { ExchangeRates, NotificationSetting, SortOrder } from '@/domain/types';
import { accentPresets, type AccentPresetId } from '@/theme/tokens';
import { logger } from '@/utils/logger';

export type ThemePreference = 'system' | 'light' | 'dark';

type PersistedSettings = {
  themePreference: ThemePreference;
  /** テーマカラー（プレミアム機能）。無料ユーザーは常に 'default' として扱う */
  accentPreset: AccentPresetId;
  /** 一覧の並び替え（プレミアム機能）。無料ユーザーは常に登録順 */
  sortOrder: SortOrder;
  /** 1 外貨 = n 円（ユーザー入力） */
  exchangeRates: ExchangeRates;
  /** 通知の全体設定。無料版は全サブスクにこの設定を一律で適用する */
  notificationDefaults: NotificationSetting;
};

type SettingsState = PersistedSettings & {
  setThemePreference: (value: ThemePreference) => void;
  setAccentPreset: (value: AccentPresetId) => void;
  setSortOrder: (value: SortOrder) => void;
  setExchangeRates: (value: ExchangeRates) => void;
  setNotificationDefaults: (value: NotificationSetting) => void;
};

export const DEFAULT_SETTINGS: PersistedSettings = {
  themePreference: 'system',
  accentPreset: 'default',
  sortOrder: 'renewal',
  exchangeRates: {},
  notificationDefaults: { enabled: true, daysBefore: 3, time: '09:00' },
};

const PERSISTED_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof PersistedSettings)[];

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULT_SETTINGS,
  setThemePreference: (themePreference) => set({ themePreference }),
  setAccentPreset: (accentPreset) => set({ accentPreset }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setExchangeRates: (exchangeRates) => set({ exchangeRates }),
  setNotificationDefaults: (notificationDefaults) => set({ notificationDefaults }),
}));

/** 保存値を検証して取り込む（不正な値は既定値のまま） */
function sanitize(raw: Record<string, unknown>): Partial<PersistedSettings> {
  const result: Partial<PersistedSettings> = {};
  if (
    raw.themePreference === 'system' ||
    raw.themePreference === 'light' ||
    raw.themePreference === 'dark'
  ) {
    result.themePreference = raw.themePreference;
  }
  if (typeof raw.accentPreset === 'string' && raw.accentPreset in accentPresets) {
    result.accentPreset = raw.accentPreset as AccentPresetId;
  }
  if (
    typeof raw.sortOrder === 'string' &&
    ['created', 'renewal', 'amountDesc', 'amountAsc', 'name'].includes(raw.sortOrder)
  ) {
    result.sortOrder = raw.sortOrder as SortOrder;
  }
  if (raw.exchangeRates && typeof raw.exchangeRates === 'object') {
    const rates: ExchangeRates = {};
    for (const code of currencyCodes) {
      const value = (raw.exchangeRates as Record<string, unknown>)[code];
      if (typeof value === 'number' && value > 0) rates[code] = value;
    }
    result.exchangeRates = rates;
  }
  const n = raw.notificationDefaults as Partial<NotificationSetting> | undefined;
  if (
    n &&
    typeof n.enabled === 'boolean' &&
    typeof n.daysBefore === 'number' &&
    typeof n.time === 'string' &&
    /^\d{2}:\d{2}$/.test(n.time)
  ) {
    result.notificationDefaults = { enabled: n.enabled, daysBefore: n.daysBefore, time: n.time };
  }
  return result;
}

let unsubscribe: (() => void) | null = null;

/** settings テーブルから読み込み、以後の変更を書き戻す */
export async function hydrateSettings(repository: SettingsRepository): Promise<void> {
  const stored = sanitize(await repository.getAll());
  useSettingsStore.setState(stored);
  unsubscribe?.();
  unsubscribe = useSettingsStore.subscribe((state, prev) => {
    for (const key of PERSISTED_KEYS) {
      if (state[key] !== prev[key]) {
        repository
          .set(key, state[key])
          .catch((error) => logger.error(`failed to save ${key}`, error));
      }
    }
  });
}
