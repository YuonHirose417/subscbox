import { addCycles, compareDate, dateOfDateTime, diffDays } from './dates';
import { fromMinor, toJpy } from './money';
import type {
  BillingCycle,
  CurrencyCode,
  DateString,
  ExchangeRates,
  PriceHistoryEntry,
  Subscription,
} from './types';

/**
 * 月額換算（通常の単位・小数のまま）。
 * week → amount × 52 / 12 / interval、month → amount / interval、year → amount / 12 / interval
 */
export function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  switch (cycle.unit) {
    case 'week':
      return (amount * 52) / 12 / cycle.interval;
    case 'month':
      return amount / cycle.interval;
    case 'year':
      return amount / 12 / cycle.interval;
  }
}

/** 年額換算 = 月額換算 × 12 */
export function yearlyEquivalent(amount: number, cycle: BillingCycle): number {
  return monthlyEquivalent(amount, cycle) * 12;
}

/** サブスクの月額換算（円）。レート未設定の外貨は null */
export function monthlyJpy(
  sub: Pick<Subscription, 'amountMinor' | 'currency' | 'cycle'>,
  rates: ExchangeRates,
): number | null {
  const amount = toJpy(fromMinor(sub.amountMinor, sub.currency), sub.currency, rates);
  return amount === null ? null : monthlyEquivalent(amount, sub.cycle);
}

/** start + n×周期 ≥ from となる最小の n（n ≥ minN） */
export function firstCycleIndexOnOrAfter(
  start: DateString,
  cycle: BillingCycle,
  from: DateString,
  minN = 0,
): number {
  // おおよその n を先に見積もってから前後を調整する（長期間でもループが短い）
  const approxDays = { week: 7, month: 30.436875, year: 365.2425 }[cycle.unit] * cycle.interval;
  let n = Math.max(minN, Math.floor(diffDays(start, from) / approxDays) - 1);
  while (n > minN && compareDate(addCycles(start, cycle, n - 1), from) >= 0) n -= 1;
  while (compareDate(addCycles(start, cycle, n), from) < 0) n += 1;
  return n;
}

/**
 * 基準日 start から数えて、from 以降で最初の請求日（start + n×周期、n ≥ minN）。
 * 前回の更新日に足し続けないので月末のずれが起きない。
 */
export function firstBillingOnOrAfter(
  start: DateString,
  cycle: BillingCycle,
  from: DateString,
  minN = 0,
): DateString {
  return addCycles(start, cycle, firstCycleIndexOnOrAfter(start, cycle, from, minN));
}

/**
 * 次回更新日の繰り越し。nextRenewalDate が過去なら、今日以降で最初の請求日にする。
 * 今日・未来ならそのまま返す。
 */
export function rollForwardRenewal(
  sub: Pick<Subscription, 'startDate' | 'cycle' | 'nextRenewalDate'>,
  todayDate: DateString,
): DateString {
  if (compareDate(sub.nextRenewalDate, todayDate) >= 0) return sub.nextRenewalDate;
  return firstBillingOnOrAfter(sub.startDate, sub.cycle, todayDate, 1);
}

/** 契約開始日から1周期後（新規登録時の次回更新日の初期値） */
export function defaultNextRenewal(start: DateString, cycle: BillingCycle): DateString {
  return addCycles(start, cycle, 1);
}

/** 残り日数（今日=0） */
export function daysUntil(date: DateString, todayDate: DateString): number {
  return diffDays(todayDate, date);
}

/** その日に有効だったか（開始日 ≤ date かつ 未解約 or 解約日 > date） */
export function isActiveOn(
  sub: Pick<Subscription, 'startDate' | 'status' | 'cancelledAt'>,
  date: DateString,
): boolean {
  if (compareDate(sub.startDate, date) > 0) return false;
  if (sub.status === 'cancelled' && sub.cancelledAt) {
    return compareDate(dateOfDateTime(sub.cancelledAt), date) > 0;
  }
  return sub.status === 'active';
}

export type PricePoint = { amountMinor: number; currency: CurrencyCode; cycle: BillingCycle };

/** date 時点で有効だった料金（price_history の effectiveFrom ≤ date の最新）。履歴がなければ現在値 */
export function priceAt(
  sub: Subscription,
  history: readonly PriceHistoryEntry[],
  date: DateString,
): PricePoint {
  let best: PriceHistoryEntry | null = null;
  for (const h of history) {
    if (h.subscriptionId !== sub.id) continue;
    if (compareDate(h.effectiveFrom, date) > 0) continue;
    if (!best || compareDate(h.effectiveFrom, best.effectiveFrom) >= 0) best = h;
  }
  return best ?? { amountMinor: sub.amountMinor, currency: sub.currency, cycle: sub.cycle };
}

/** 期間 [from, to] に発生する請求日を列挙する（契約開始日を初回請求日とする。解約後は含めない） */
export function billingDatesInRange(
  sub: Pick<Subscription, 'startDate' | 'cycle' | 'status' | 'cancelledAt'>,
  from: DateString,
  to: DateString,
): DateString[] {
  const dates: DateString[] = [];
  if (compareDate(from, to) > 0) return dates;
  let n = firstCycleIndexOnOrAfter(sub.startDate, sub.cycle, from, 0);
  for (let date = addCycles(sub.startDate, sub.cycle, n); compareDate(date, to) <= 0;) {
    if (isActiveOn(sub, date)) dates.push(date);
    n += 1;
    date = addCycles(sub.startDate, sub.cycle, n);
  }
  return dates;
}

/** 請求日ベースの合計（円）。外貨でレート未設定のものは除外 */
export function billedTotalJpy(
  subs: readonly Subscription[],
  history: readonly PriceHistoryEntry[],
  rates: ExchangeRates,
  from: DateString,
  to: DateString,
): number {
  let total = 0;
  for (const sub of subs) {
    for (const date of billingDatesInRange(sub, from, to)) {
      const price = priceAt(sub, history, date);
      const jpy = toJpy(fromMinor(price.amountMinor, price.currency), price.currency, rates);
      if (jpy !== null) total += jpy;
    }
  }
  return total;
}

/** 「/月」「/年」「/週」「/3か月」 */
export function cycleSuffix(cycle: BillingCycle): string {
  const unit = { week: '週', month: '月', year: '年' }[cycle.unit];
  if (cycle.interval === 1) return `/${unit}`;
  const label = { week: '週', month: 'か月', year: '年' }[cycle.unit];
  return `/${cycle.interval}${label}`;
}
