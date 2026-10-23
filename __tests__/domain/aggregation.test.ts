import {
  categoryBreakdown,
  currentMonthlyTotal,
  monthOverMonth,
  monthlyTotalAt,
  periodAmountJpy,
  upcomingRenewals,
} from '@/domain/aggregation';
import type { Category } from '@/domain/types';

import { makeSub } from './fixtures';

const categories: Category[] = ['video_music', 'productivity', 'cloud', 'game', 'sns', 'other'].map(
  (id, i) => ({ id, name: id, color: `c-${id}`, icon: 'circle', sortOrder: i, isDefault: true }),
);

describe('totals', () => {
  it('sums current monthly equivalents excluding cancelled and missing rates', () => {
    const subs = [
      makeSub({ amountMinor: 1590 }),
      makeSub({ amountMinor: 12000, cycle: { unit: 'year', interval: 1 } }),
      makeSub({ amountMinor: 500, status: 'cancelled', cancelledAt: '2025-01-01T00:00:00Z' }),
      makeSub({ amountMinor: 999, currency: 'USD' }),
    ];
    const result = currentMonthlyTotal(subs, {});
    expect(result.total).toBe(1590 + 1000);
    expect(result.missingRateCurrencies).toEqual(['USD']);
    expect(currentMonthlyTotal(subs, { USD: 100 }).total).toBeCloseTo(1590 + 1000 + 999);
  });

  it('returns zero for no data', () => {
    expect(currentMonthlyTotal([], {})).toEqual({ total: 0, missingRateCurrencies: [] });
  });

  it('computes month over month from start dates, cancellations and price history', () => {
    const a = makeSub({ id: 'a', amountMinor: 1000, startDate: '2025-01-10' });
    const b = makeSub({ id: 'b', amountMinor: 2100, startDate: '2025-10-05' }); // 今月開始
    const c = makeSub({
      id: 'c',
      amountMinor: 500,
      startDate: '2025-01-01',
      status: 'cancelled',
      cancelledAt: '2025-10-02T00:00:00Z',
    }); // 今月解約
    const history = [
      {
        id: 'h1',
        subscriptionId: 'a',
        amountMinor: 800,
        currency: 'JPY' as const,
        cycle: a.cycle,
        effectiveFrom: '2025-01-10',
      },
      {
        id: 'h2',
        subscriptionId: 'a',
        amountMinor: 1000,
        currency: 'JPY' as const,
        cycle: a.cycle,
        effectiveFrom: '2025-10-01',
      },
    ];
    expect(monthlyTotalAt([a, b, c], history, {}, '2025-09-30').total).toBe(800 + 500);
    expect(monthOverMonth([a, b, c], history, {}, '2025-10-17')).toBe(1000 + 2100 - (800 + 500));
  });
});

describe('periodAmountJpy', () => {
  it('returns monthly, yearly and cumulative amounts', () => {
    const sub = makeSub({ amountMinor: 1000, startDate: '2025-01-20' });
    expect(periodAmountJpy(sub, [], {}, 'month', '2025-10-17')).toBe(1000);
    expect(periodAmountJpy(sub, [], {}, 'year', '2025-10-17')).toBe(12000);
    // 1/20〜9/20 の9回
    expect(periodAmountJpy(sub, [], {}, 'all', '2025-10-17')).toBe(9000);
    expect(periodAmountJpy({ ...sub, startDate: '2025-11-01' }, [], {}, 'all', '2025-10-17')).toBe(
      0,
    );
  });
});

describe('categoryBreakdown', () => {
  it('groups by category in descending order with ratios', () => {
    const subs = [
      makeSub({ categoryId: 'video_music', amountMinor: 1590 }),
      makeSub({ categoryId: 'video_music', amountMinor: 1280 }),
      makeSub({ categoryId: 'cloud', amountMinor: 150 }),
      makeSub({ categoryId: 'productivity', amountMinor: 2650 }),
    ];
    const result = categoryBreakdown(subs, [], categories, {}, 'month', '2025-10-17');
    expect(result.segments.map((s) => s.categoryId)).toEqual([
      'video_music',
      'productivity',
      'cloud',
    ]);
    expect(result.total).toBe(5670);
    expect(result.segments[0].amount).toBe(2870);
    expect(result.segments.reduce((s, x) => s + x.ratio, 0)).toBeCloseTo(1);
    expect(result.segments[0].color).toBe('c-video_music');
  });

  it('keeps top 5 and merges the rest into その他', () => {
    const extra: Category = {
      id: 'custom',
      name: 'custom',
      color: 'c-custom',
      icon: 'circle',
      sortOrder: 6,
      isDefault: false,
    };
    const subs = ['video_music', 'productivity', 'cloud', 'game', 'sns', 'custom', 'other'].map(
      (id, i) => makeSub({ categoryId: id, amountMinor: 1000 * (7 - i) }),
    );
    const result = categoryBreakdown(subs, [], [...categories, extra], {}, 'month', '2025-10-17');
    expect(result.segments).toHaveLength(6);
    expect(result.segments[5]).toMatchObject({ categoryId: 'other', amount: 2000 + 1000 });
  });

  it('handles empty data', () => {
    const result = categoryBreakdown([], [], categories, {}, 'year', '2025-10-17');
    expect(result.segments).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('reports missing rates', () => {
    const result = categoryBreakdown(
      [makeSub({ currency: 'USD' })],
      [],
      categories,
      {},
      'month',
      '2025-10-17',
    );
    expect(result.missingRateCurrencies).toEqual(['USD']);
    expect(result.total).toBe(0);
  });
});

describe('upcomingRenewals', () => {
  it('sorts active subscriptions by next renewal and limits', () => {
    const subs = [
      makeSub({ name: 'b', nextRenewalDate: '2025-10-22' }),
      makeSub({ name: 'a', nextRenewalDate: '2025-10-20' }),
      makeSub({
        name: 'x',
        nextRenewalDate: '2025-10-18',
        status: 'cancelled',
        cancelledAt: '2025-10-01T00:00:00Z',
      }),
      makeSub({ name: 'c', nextRenewalDate: '2025-11-01' }),
      makeSub({ name: 'd', nextRenewalDate: '2025-11-05' }),
    ];
    expect(upcomingRenewals(subs, 3).map((s) => s.name)).toEqual(['a', 'b', 'c']);
  });
});
