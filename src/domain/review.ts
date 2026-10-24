import { monthlyJpy } from './billing';
import { compareDate, diffDays } from './dates';
import type { DateString, ExchangeRates, Subscription } from './types';

/** 最終利用日からこの日数が過ぎたら見直し候補にする */
export const REVIEW_THRESHOLD_DAYS = 60;

export type ReviewCandidate = {
  subscription: Subscription;
  /** 最終利用日から今日までの日数 */
  daysUnused: number;
};

/**
 * しばらく使っていない可能性のあるサブスク（契約中・最終利用日を記録済みで、しきい値以上たったもの）。
 * 使っていない期間の長い順。最終利用日が未記録のものは対象外。
 */
export function reviewCandidates(
  subs: readonly Subscription[],
  today: DateString,
  thresholdDays = REVIEW_THRESHOLD_DAYS,
): ReviewCandidate[] {
  return subs
    .filter((s) => s.status === 'active' && s.lastUsedDate !== null)
    .filter((s) => compareDate(s.lastUsedDate!, today) <= 0)
    .map((s) => ({ subscription: s, daysUnused: diffDays(s.lastUsedDate!, today) }))
    .filter((c) => c.daysUnused >= thresholdDays)
    .sort(
      (a, b) =>
        b.daysUnused - a.daysUnused || a.subscription.name.localeCompare(b.subscription.name),
    );
}

/** 「3ヶ月以上利用がありません」（30日を1か月として切り捨て） */
export function unusedLabel(daysUnused: number): string {
  const months = Math.floor(daysUnused / 30);
  return months >= 1 ? `${months}ヶ月以上利用がありません` : `${daysUnused}日以上利用がありません`;
}

/**
 * 候補をすべて解約した場合の年間の節約額（円、10円単位に丸めた目安）。
 * レート未設定の外貨は含めない（excluded に件数を返す）。
 */
export function potentialYearlySavings(
  candidates: readonly ReviewCandidate[],
  rates: ExchangeRates,
): { amount: number; excluded: number } {
  let total = 0;
  let excluded = 0;
  for (const { subscription } of candidates) {
    const monthly = monthlyJpy(subscription, rates);
    if (monthly === null) excluded += 1;
    else total += monthly * 12;
  }
  return { amount: Math.round(total / 10) * 10, excluded };
}
