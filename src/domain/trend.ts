import { monthlyTotalAt, periodAmountJpy } from './aggregation';
import {
  billedTotalJpy,
  billingDatesInRange,
  isActiveOn,
  monthlyEquivalent,
  priceAt,
} from './billing';
import { addDays, addMonthsTo, compareDate, endOfMonth, parseDate, startOfMonth } from './dates';
import { fromMinor, toJpy } from './money';
import type {
  CurrencyCode,
  DateString,
  ExchangeRates,
  Period,
  PriceHistoryEntry,
  Subscription,
} from './types';

export type TrendPoint = {
  /** 'YYYY-MM' または 'YYYY' */
  key: string;
  /** 「4月」「2025年」 */
  label: string;
  /** 円 */
  total: number;
  /** 当月・当年 */
  isCurrent: boolean;
  /** その月（年）の基準日：月末。当月は今日 */
  asOf: DateString;
};

/** 月の基準日：月末。当月（未来を含む月）は今日 */
function monthAsOf(monthStart: DateString, todayDate: DateString): DateString {
  const end = endOfMonth(monthStart);
  return compareDate(end, todayDate) > 0 ? todayDate : end;
}

/**
 * 月別の支出推移：各月末時点で有効だったサブスクの、その時点の料金での月額換算合計。
 * 直近 months か月（今月を含む）を古い順に返す。
 */
export function monthlyTrend(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  todayDate: DateString,
  months: number,
): TrendPoint[] {
  const thisMonth = startOfMonth(todayDate);
  const points: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const monthStart = addMonthsTo(thisMonth, -i);
    const asOf = monthAsOf(monthStart, todayDate);
    points.push({
      key: monthStart.slice(0, 7),
      label: `${parseDate(monthStart).getMonth() + 1}月`,
      total: monthlyTotalAt(subs, history, rates, asOf).total,
      isCurrent: i === 0,
      asOf,
    });
  }
  return points;
}

/** 年別の推移：その年の各月の値（月額換算）の合計。今年は今月までの合計 */
export function yearlyTrend(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  todayDate: DateString,
  years: number,
): TrendPoint[] {
  const currentYear = parseDate(todayDate).getFullYear();
  const points: TrendPoint[] = [];
  for (let y = currentYear - years + 1; y <= currentYear; y += 1) {
    let total = 0;
    const lastMonth = y === currentYear ? parseDate(todayDate).getMonth() : 11;
    for (let m = 0; m <= lastMonth; m += 1) {
      const monthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      total += monthlyTotalAt(subs, history, rates, monthAsOf(monthStart, todayDate)).total;
    }
    points.push({
      key: String(y),
      label: `${y}年`,
      total,
      isCurrent: y === currentYear,
      asOf: y === currentYear ? todayDate : `${y}-12-31`,
    });
  }
  return points;
}

/** 最も古い契約開始日（データがなければ null） */
export function earliestStart(subs: readonly Subscription[]): DateString | null {
  return subs.reduce<DateString | null>(
    (min, s) => (min === null || compareDate(s.startDate, min) < 0 ? s.startDate : min),
    null,
  );
}

/** 月数（a の月から b の月まで、両端を含む） */
export function monthsBetween(a: DateString, b: DateString): number {
  const x = parseDate(a);
  const y = parseDate(b);
  return (y.getFullYear() - x.getFullYear()) * 12 + (y.getMonth() - x.getMonth()) + 1;
}

/**
 * 期間別の推移。month=直近7か月、year=直近5年、
 * all=最初の契約月から（12か月以内なら月別、それより長ければ年別）
 */
export function trendForPeriod(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  period: Period,
  todayDate: DateString,
): TrendPoint[] {
  if (period === 'month') return monthlyTrend(subs, history, rates, todayDate, 7);
  if (period === 'year') return yearlyTrend(subs, history, rates, todayDate, 5);
  const first = earliestStart(subs);
  if (!first || compareDate(first, todayDate) > 0) {
    return monthlyTrend(subs, history, rates, todayDate, 7);
  }
  const span = monthsBetween(first, todayDate);
  if (span <= 12) return monthlyTrend(subs, history, rates, todayDate, Math.max(span, 1));
  const years = parseDate(todayDate).getFullYear() - parseDate(first).getFullYear() + 1;
  return yearlyTrend(subs, history, rates, todayDate, years);
}

export type BreakdownItem = {
  subscription: Subscription;
  /** 円 */
  amount: number;
};

/** ある日時点の内訳（その時点で有効なサブスクと、その時点の料金での月額換算） */
export function breakdownAt(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  asOf: DateString,
): BreakdownItem[] {
  const items: BreakdownItem[] = [];
  for (const sub of subs) {
    if (!isActiveOn(sub, asOf)) continue;
    const price = priceAt(sub, history, asOf);
    const jpy = toJpy(fromMinor(price.amountMinor, price.currency), price.currency, rates);
    if (jpy === null) continue;
    items.push({ subscription: sub, amount: monthlyEquivalent(jpy, price.cycle) });
  }
  return items.sort((a, b) => b.amount - a.amount);
}

export type RankingItem = BreakdownItem & { ratio: number };

/** 支出ランキング（期間別の金額の大きい順に上位 limit 件、全体に占める割合付き） */
export function spendingRanking(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  period: Period,
  todayDate: DateString,
  limit = 5,
): RankingItem[] {
  const targets = period === 'all' ? subs : subs.filter((s) => s.status === 'active');
  const items: BreakdownItem[] = [];
  for (const sub of targets) {
    const amount = periodAmountJpy(sub, history, rates, period, todayDate);
    if (amount !== null && amount > 0) items.push({ subscription: sub, amount });
  }
  const total = items.reduce((s, i) => s + i.amount, 0);
  return items
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((i) => ({ ...i, ratio: total > 0 ? i.amount / total : 0 }));
}

/** 今後12か月に実際に請求される見込み額（請求日ベース、今日から1年間） */
export function yearlyBillingForecast(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  todayDate: DateString,
): number {
  const active = subs.filter((s) => s.status === 'active');
  return billedTotalJpy(active, history, rates, todayDate, addDays(addMonthsTo(todayDate, 12), -1));
}

export type BillingEvent = {
  subscription: Subscription;
  date: DateString;
  amountMinor: number;
  currency: CurrencyCode;
  /** 円換算（レート未設定なら null） */
  amountJpy: number | null;
};

/** 期間内の請求予定（請求日ベース）を日付順に列挙する */
export function billingEvents(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  from: DateString,
  to: DateString,
): BillingEvent[] {
  const events: BillingEvent[] = [];
  for (const sub of subs) {
    for (const date of billingDatesInRange(sub, from, to)) {
      const price = priceAt(sub, history, date);
      events.push({
        subscription: sub,
        date,
        amountMinor: price.amountMinor,
        currency: price.currency,
        amountJpy: toJpy(fromMinor(price.amountMinor, price.currency), price.currency, rates),
      });
    }
  }
  return events.sort(
    (a, b) => compareDate(a.date, b.date) || a.subscription.name.localeCompare(b.subscription.name),
  );
}

/** 今月の請求予定（1日〜月末） */
export function thisMonthBillings(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  todayDate: DateString,
): BillingEvent[] {
  return billingEvents(subs, history, rates, startOfMonth(todayDate), endOfMonth(todayDate));
}

export function averageOf(points: readonly TrendPoint[]): number {
  if (points.length === 0) return 0;
  return points.reduce((s, p) => s + p.total, 0) / points.length;
}
