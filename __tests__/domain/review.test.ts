import {
  potentialYearlySavings,
  REVIEW_THRESHOLD_DAYS,
  reviewCandidates,
  unusedLabel,
} from '@/domain/review';

import { makeSub } from './fixtures';

const today = '2025-10-17';

describe('reviewCandidates', () => {
  it('lists active subscriptions unused for the threshold, longest first', () => {
    const subs = [
      makeSub({ id: 'a', name: 'A', lastUsedDate: '2025-07-01' }), // 108日
      makeSub({ id: 'b', name: 'B', lastUsedDate: '2025-08-18' }), // 60日（境界）
      makeSub({ id: 'c', name: 'C', lastUsedDate: '2025-08-19' }), // 59日
      makeSub({ id: 'd', name: 'D', lastUsedDate: null }),
      makeSub({ id: 'e', name: 'E', lastUsedDate: '2025-01-01', status: 'cancelled' }),
      makeSub({ id: 'f', name: 'F', lastUsedDate: '2025-12-01' }), // 未来の日付は対象外
    ];
    const result = reviewCandidates(subs, today);
    expect(result.map((c) => [c.subscription.id, c.daysUnused])).toEqual([
      ['a', 108],
      ['b', REVIEW_THRESHOLD_DAYS],
    ]);
  });
});

describe('unusedLabel', () => {
  it('rounds down to months', () => {
    expect(unusedLabel(60)).toBe('2ヶ月以上利用がありません');
    expect(unusedLabel(89)).toBe('2ヶ月以上利用がありません');
    expect(unusedLabel(95)).toBe('3ヶ月以上利用がありません');
    expect(unusedLabel(20)).toBe('20日以上利用がありません');
  });
});

describe('potentialYearlySavings', () => {
  it('sums yearly amounts in yen and skips currencies without a rate', () => {
    const candidates = reviewCandidates(
      [
        makeSub({ amountMinor: 980, lastUsedDate: '2025-01-01' }),
        makeSub({
          amountMinor: 3000,
          cycle: { unit: 'year', interval: 1 },
          lastUsedDate: '2025-01-01',
        }),
        makeSub({ amountMinor: 999, currency: 'USD', lastUsedDate: '2025-01-01' }),
      ],
      today,
    );
    expect(potentialYearlySavings(candidates, {})).toEqual({ amount: 14760, excluded: 1 });
    expect(potentialYearlySavings(candidates, { USD: 150 }).amount).toBe(
      Math.round((980 * 12 + 3000 + 9.99 * 150 * 12) / 10) * 10,
    );
  });
});
