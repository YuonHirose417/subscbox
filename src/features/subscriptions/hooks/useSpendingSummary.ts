import { useMemo } from 'react';

import {
  activeSubscriptions,
  categoryBreakdown,
  currentMonthlyTotal,
  monthOverMonth,
  upcomingRenewals,
  type CategoryBreakdown,
} from '@/domain/aggregation';
import type { Period, Subscription } from '@/domain/types';
import { useCategories } from '@/features/categories/store';
import { useSettingsStore } from '@/features/settings/store';

import { useSubscriptionStore } from '../store';
import { useToday } from './useToday';

export type SpendingSummary = {
  /** 月額換算合計（円） */
  monthlyTotal: number;
  /** 前月比（円） */
  monthOverMonth: number;
  /** 年間の支払い（予想）＝月額換算×12 */
  yearlyForecast: number;
  activeCount: number;
  breakdown: CategoryBreakdown;
  upcoming: Subscription[];
  missingRateCurrencies: string[];
};

/** ホーム用の派生値。保存はせず、domain の純粋関数で毎回算出する */
export function useSpendingSummary(period: Period): SpendingSummary {
  const items = useSubscriptionStore((s) => s.items);
  const priceHistory = useSubscriptionStore((s) => s.priceHistory);
  const rates = useSettingsStore((s) => s.exchangeRates);
  const categories = useCategories();
  const today = useToday();

  const base = useMemo(() => {
    const total = currentMonthlyTotal(items, rates);
    return {
      monthlyTotal: total.total,
      monthOverMonth: monthOverMonth(items, priceHistory, rates, today),
      yearlyForecast: total.total * 12,
      activeCount: activeSubscriptions(items).length,
      upcoming: upcomingRenewals(items, 3),
      missingRateCurrencies: total.missingRateCurrencies,
    };
  }, [items, priceHistory, rates, today]);

  const breakdown = useMemo(
    () => categoryBreakdown(items, priceHistory, categories, rates, period, today),
    [items, priceHistory, categories, rates, period, today],
  );

  return { ...base, breakdown };
}
