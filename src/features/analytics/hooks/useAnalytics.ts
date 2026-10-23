import { useMemo } from 'react';

import { categoryBreakdown, currentMonthlyTotal } from '@/domain/aggregation';
import {
  averageOf,
  spendingRanking,
  thisMonthBillings,
  trendForPeriod,
  yearlyBillingForecast,
} from '@/domain/trend';
import type { Period } from '@/domain/types';
import { useCategories } from '@/features/categories/store';
import { useSettingsStore } from '@/features/settings/store';
import { useToday } from '@/features/subscriptions/hooks/useToday';
import { useSubscriptionStore } from '@/features/subscriptions/store';

/** 支出分析画面の派生値（保存せず domain の純粋関数で算出） */
export function useAnalytics(trendPeriod: Period, categoryPeriod: Period) {
  const items = useSubscriptionStore((s) => s.items);
  const priceHistory = useSubscriptionStore((s) => s.priceHistory);
  const rates = useSettingsStore((s) => s.exchangeRates);
  const categories = useCategories();
  const today = useToday();

  const trend = useMemo(
    () => trendForPeriod(items, priceHistory, rates, trendPeriod, today),
    [items, priceHistory, rates, trendPeriod, today],
  );
  const breakdown = useMemo(
    () => categoryBreakdown(items, priceHistory, categories, rates, categoryPeriod, today),
    [items, priceHistory, categories, rates, categoryPeriod, today],
  );
  const ranking = useMemo(
    () => spendingRanking(items, priceHistory, rates, trendPeriod, today),
    [items, priceHistory, rates, trendPeriod, today],
  );
  const summary = useMemo(() => {
    const monthly = currentMonthlyTotal(items, rates);
    return {
      forecast: yearlyBillingForecast(items, priceHistory, rates, today),
      monthlyTimes12: monthly.total * 12,
      missingRateCurrencies: monthly.missingRateCurrencies,
      bills: thisMonthBillings(items, priceHistory, rates, today),
    };
  }, [items, priceHistory, rates, today]);

  return {
    today,
    hasData: items.length > 0,
    trend,
    average: averageOf(trend),
    breakdown,
    ranking,
    ...summary,
  };
}
