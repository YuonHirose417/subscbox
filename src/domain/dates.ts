import {
  addDays as addDaysFn,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfMonth as endOfMonthFn,
  format,
  isValid,
  startOfMonth as startOfMonthFn,
} from 'date-fns';

import { currentTime } from '@/utils/clock';

import type { BillingCycle, DateString } from './types';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 'YYYY-MM-DD' を端末ローカルの 0:00 の Date に変換する */
export function parseDate(value: DateString): Date {
  const m = DATE_RE.exec(value);
  if (!m) throw new Error(`Invalid date string: ${value}`);
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (!isValid(date) || format(date, 'yyyy-MM-dd') !== value) {
    throw new Error(`Invalid date string: ${value}`);
  }
  return date;
}

export function isDateString(value: unknown): value is DateString {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  try {
    parseDate(value);
    return true;
  } catch {
    return false;
  }
}

export function toDateString(date: Date): DateString {
  return format(date, 'yyyy-MM-dd');
}

export function today(now: Date = currentTime()): DateString {
  return toDateString(now);
}

export function addDays(value: DateString, days: number): DateString {
  return toDateString(addDaysFn(parseDate(value), days));
}

/**
 * 基準日から n 周期後の日付。毎回「基準日 + n×周期」で計算するため、
 * 月末開始（1/31）でも 2/28 → 3/31 → 4/30 のように元の日にちへ戻る。
 */
export function addCycles(base: DateString, cycle: BillingCycle, n: number): DateString {
  const date = parseDate(base);
  const count = cycle.interval * n;
  switch (cycle.unit) {
    case 'week':
      return toDateString(addDaysFn(date, count * 7));
    case 'month':
      return toDateString(addMonths(date, count));
    case 'year':
      return toDateString(addYears(date, count));
  }
}

/** b − a の日数（同日=0） */
export function diffDays(a: DateString, b: DateString): number {
  return differenceInCalendarDays(parseDate(b), parseDate(a));
}

export function compareDate(a: DateString, b: DateString): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function startOfMonth(value: DateString): DateString {
  return toDateString(startOfMonthFn(parseDate(value)));
}

export function endOfMonth(value: DateString): DateString {
  return toDateString(endOfMonthFn(parseDate(value)));
}

export function addMonthsTo(value: DateString, months: number): DateString {
  return toDateString(addMonths(parseDate(value), months));
}

/** 'YYYY-MM' */
export function monthKey(value: DateString): string {
  return value.slice(0, 7);
}

/** ISO 日時（UTC）を端末ローカルの日付に変換する */
export function dateOfDateTime(value: string): DateString {
  return toDateString(new Date(value));
}

/** 「10月20日」 */
export function formatMonthDay(value: DateString): string {
  const d = parseDate(value);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 「2025年10月20日」 */
export function formatFullDate(value: DateString): string {
  const d = parseDate(value);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 「今日」「明日」「あと3日」。過去日は「3日前」 */
export function formatDaysLeft(days: number): string {
  if (days === 0) return '今日';
  if (days === 1) return '明日';
  if (days < 0) return `${-days}日前`;
  return `あと${days}日`;
}
