import { billingDatesInRange, priceAt } from './billing';
import { addMonthsTo, compareDate } from './dates';
import type { CurrencyCode, DateString, Payment, PriceHistoryEntry, Subscription } from './types';

/** 自動生成する支払い履歴の範囲（今日から遡る月数）。古すぎる契約で大量に生成しない */
export const PAYMENT_HISTORY_WINDOW_MONTHS = 36;

export type PaymentDraft = {
  subscriptionId: string;
  billedOn: DateString;
  amountMinor: number;
  currency: CurrencyCode;
};

export type PaymentSyncPlan = { toInsert: PaymentDraft[]; toDeleteIds: string[] };

/**
 * 支払い履歴の同期計画（純粋関数）。
 * - 契約開始日〜今日（直近36か月）の請求日のうち、まだ行が無い日を「支払い済み」として追加する
 * - ユーザーが削除した日（status='skipped'）は再生成しない
 * - ユーザーが編集していない自動生成の行で、請求日でなくなったもの（開始日・周期の変更など）は削除する
 */
export function planPaymentSync(
  sub: Subscription,
  history: readonly PriceHistoryEntry[],
  existing: readonly Payment[],
  todayDate: DateString,
): PaymentSyncPlan {
  const windowStart = addMonthsTo(todayDate, -PAYMENT_HISTORY_WINDOW_MONTHS);
  const from = compareDate(sub.startDate, windowStart) > 0 ? sub.startDate : windowStart;
  const dates = compareDate(from, todayDate) <= 0 ? billingDatesInRange(sub, from, todayDate) : [];
  const valid = new Set(dates);
  const mine = existing.filter((p) => p.subscriptionId === sub.id);
  const present = new Set(mine.map((p) => p.billedOn));

  const toInsert = dates
    .filter((d) => !present.has(d))
    .map((billedOn) => {
      const price = priceAt(sub, history, billedOn);
      return {
        subscriptionId: sub.id,
        billedOn,
        amountMinor: price.amountMinor,
        currency: price.currency,
      };
    });
  const toDeleteIds = mine
    .filter(
      (p) =>
        !p.isUserEdited &&
        p.status === 'paid' &&
        compareDate(p.billedOn, windowStart) >= 0 &&
        !valid.has(p.billedOn),
    )
    .map((p) => p.id);

  return { toInsert, toDeleteIds };
}

/** 表示用：削除（skipped）を除いた支払い履歴を新しい順に */
export function visiblePayments(payments: readonly Payment[], subscriptionId?: string): Payment[] {
  return payments
    .filter((p) => p.status === 'paid' && (!subscriptionId || p.subscriptionId === subscriptionId))
    .sort((a, b) => compareDate(b.billedOn, a.billedOn));
}
