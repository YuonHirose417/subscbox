import { billedTotalJpy, isActiveOn, monthlyEquivalent, monthlyJpy, priceAt } from './billing';
import { addDays, compareDate, startOfMonth } from './dates';
import { fromMinor, toJpy } from './money';
import type {
  Category,
  CurrencyCode,
  DateString,
  ExchangeRates,
  Period,
  PriceHistoryEntry,
  Subscription,
} from './types';

export type Total = {
  /** 円（小数あり。表示時に丸める） */
  total: number;
  /** レート未設定のため合計から除外した外貨 */
  missingRateCurrencies: CurrencyCode[];
};

function collectMissing(target: Set<CurrencyCode>, currency: CurrencyCode) {
  if (currency !== 'JPY') target.add(currency);
}

export function activeSubscriptions(subs: readonly Subscription[]): Subscription[] {
  return subs.filter((s) => s.status === 'active');
}

/** 現在の月額換算合計（解約済みを除く） */
export function currentMonthlyTotal(subs: readonly Subscription[], rates: ExchangeRates): Total {
  const missing = new Set<CurrencyCode>();
  let total = 0;
  for (const sub of activeSubscriptions(subs)) {
    const monthly = monthlyJpy(sub, rates);
    if (monthly === null) collectMissing(missing, sub.currency);
    else total += monthly;
  }
  return { total, missingRateCurrencies: [...missing] };
}

/** date 時点で有効だったサブスクの、その時点の料金での月額換算合計 */
export function monthlyTotalAt(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  date: DateString,
): Total {
  const missing = new Set<CurrencyCode>();
  let total = 0;
  for (const sub of subs) {
    if (!isActiveOn(sub, date)) continue;
    const price = priceAt(sub, history, date);
    const jpy = toJpy(fromMinor(price.amountMinor, price.currency), price.currency, rates);
    if (jpy === null) collectMissing(missing, price.currency);
    else total += monthlyEquivalent(jpy, price.cycle);
  }
  return { total, missingRateCurrencies: [...missing] };
}

/** 前月比 = 現在の月額換算合計 − 先月末時点の月額換算合計 */
export function monthOverMonth(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  todayDate: DateString,
): number {
  const current = currentMonthlyTotal(subs, rates).total;
  const prevMonthEnd = addDays(startOfMonth(todayDate), -1);
  const previous = monthlyTotalAt(subs, history, rates, prevMonthEnd).total;
  return current - previous;
}

/**
 * 期間別の金額（円）。
 * month=月額換算、year=年額換算（月額×12）、all=契約開始日から今日までの推定累計（請求日ベース）
 */
export function periodAmountJpy(
  sub: Subscription,
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  period: Period,
  todayDate: DateString,
): number | null {
  if (period === 'all') {
    if (compareDate(sub.startDate, todayDate) > 0) return 0;
    const sample = toJpy(1, sub.currency, rates);
    if (sample === null) return null;
    return billedTotalJpy([sub], history, rates, sub.startDate, todayDate);
  }
  const monthly = monthlyJpy(sub, rates);
  if (monthly === null) return null;
  return period === 'month' ? monthly : monthly * 12;
}

export type CategorySegment = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  /** 0〜1 */
  ratio: number;
};

export type CategoryBreakdown = Total & { segments: CategorySegment[] };

export const OTHER_CATEGORY_ID = 'other';

/**
 * カテゴリ別集計（金額の大きい順）。上位 maxSegments カテゴリ＋残りは「その他」にまとめる。
 * period=all のときは解約済みも累計に含める。
 */
export function categoryBreakdown(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  categories: readonly Category[],
  rates: ExchangeRates,
  period: Period,
  todayDate: DateString,
  maxSegments = 5,
): CategoryBreakdown {
  const missing = new Set<CurrencyCode>();
  const sums = new Map<string, number>();
  const targets = period === 'all' ? subs : activeSubscriptions(subs);

  for (const sub of targets) {
    const amount = periodAmountJpy(sub, history, rates, period, todayDate);
    if (amount === null) {
      collectMissing(missing, sub.currency);
      continue;
    }
    if (amount <= 0) continue;
    sums.set(sub.categoryId, (sums.get(sub.categoryId) ?? 0) + amount);
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  const other = byId.get(OTHER_CATEGORY_ID);
  let entries = [...sums.entries()].sort((a, b) => b[1] - a[1]);

  if (entries.length > maxSegments + 1) {
    const head = entries.filter(([id]) => id !== OTHER_CATEGORY_ID).slice(0, maxSegments);
    const headIds = new Set(head.map(([id]) => id));
    const rest = entries
      .filter(([id]) => !headIds.has(id))
      .reduce((sum, [, amount]) => sum + amount, 0);
    entries = [...head, [OTHER_CATEGORY_ID, rest] as [string, number]];
  }

  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  const segments = entries.map(([id, amount]) => {
    const category = byId.get(id) ?? other;
    return {
      categoryId: id,
      name: category?.name ?? 'その他',
      color: category?.color ?? other?.color ?? categories[0]?.color ?? '',
      amount,
      ratio: total > 0 ? amount / total : 0,
    };
  });

  return { segments, total, missingRateCurrencies: [...missing] };
}

/** 次回更新日が近い順（解約済みを除く） */
export function upcomingRenewals(subs: readonly Subscription[], limit: number): Subscription[] {
  return activeSubscriptions(subs)
    .sort((a, b) => compareDate(a.nextRenewalDate, b.nextRenewalDate))
    .slice(0, limit);
}
