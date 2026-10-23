import { planPaymentSync, visiblePayments } from '@/domain/payments';
import {
  averageOf,
  breakdownAt,
  monthlyTrend,
  spendingRanking,
  thisMonthBillings,
  trendForPeriod,
  yearlyBillingForecast,
  yearlyTrend,
} from '@/domain/trend';
import type { Payment, PriceHistoryEntry } from '@/domain/types';

import { makeSub } from './fixtures';

const monthly = { unit: 'month', interval: 1 } as const;

describe('monthlyTrend', () => {
  it('uses the price effective at each month end and the start date', () => {
    const a = makeSub({ id: 'a', amountMinor: 1000, startDate: '2025-05-10' });
    const history: PriceHistoryEntry[] = [
      {
        id: 'h1',
        subscriptionId: 'a',
        amountMinor: 800,
        currency: 'JPY',
        cycle: monthly,
        effectiveFrom: '2025-05-10',
      },
      {
        id: 'h2',
        subscriptionId: 'a',
        amountMinor: 1000,
        currency: 'JPY',
        cycle: monthly,
        effectiveFrom: '2025-10-01',
      },
    ];
    const points = monthlyTrend([a], history, {}, '2025-10-17', 7);
    expect(points.map((p) => p.label)).toEqual(['4月', '5月', '6月', '7月', '8月', '9月', '10月']);
    expect(points.map((p) => p.total)).toEqual([0, 800, 800, 800, 800, 800, 1000]);
    expect(points[6]).toMatchObject({ isCurrent: true, asOf: '2025-10-17', key: '2025-10' });
    expect(points[5].asOf).toBe('2025-09-30');
  });

  it('drops cancelled subscriptions from the month of cancellation', () => {
    const c = makeSub({
      amountMinor: 500,
      startDate: '2025-01-01',
      status: 'cancelled',
      cancelledAt: '2025-08-15T00:00:00Z',
    });
    expect(monthlyTrend([c], [], {}, '2025-10-17', 4).map((p) => p.total)).toEqual([500, 0, 0, 0]);
  });

  it('handles empty data', () => {
    expect(monthlyTrend([], [], {}, '2025-10-17', 7).every((p) => p.total === 0)).toBe(true);
    expect(averageOf([])).toBe(0);
  });
});

describe('yearlyTrend / trendForPeriod', () => {
  it('sums monthly values per year (this year up to this month)', () => {
    const a = makeSub({ amountMinor: 1000, startDate: '2024-11-05' });
    const points = yearlyTrend([a], [], {}, '2025-03-10', 2);
    expect(points).toMatchObject([
      { label: '2024年', total: 2000 },
      { label: '2025年', total: 3000, isCurrent: true },
    ]);
  });

  it('chooses monthly or yearly buckets for all-time', () => {
    const recent = makeSub({ startDate: '2025-06-01' });
    expect(trendForPeriod([recent], [], {}, 'all', '2025-10-17')).toHaveLength(5);
    const old = makeSub({ startDate: '2022-06-01' });
    expect(trendForPeriod([old], [], {}, 'all', '2025-10-17').map((p) => p.label)).toEqual([
      '2022年',
      '2023年',
      '2024年',
      '2025年',
    ]);
    expect(trendForPeriod([], [], {}, 'all', '2025-10-17')).toHaveLength(7);
  });
});

describe('breakdown, ranking, forecast', () => {
  const subs = [
    makeSub({ name: 'A', amountMinor: 1590, startDate: '2025-01-20' }),
    makeSub({
      name: 'B',
      amountMinor: 12000,
      cycle: { unit: 'year', interval: 1 },
      startDate: '2025-03-01',
    }),
    makeSub({ name: 'C', amountMinor: 150, startDate: '2025-10-01' }),
  ];

  it('lists the breakdown at a date', () => {
    expect(
      breakdownAt(subs, [], {}, '2025-09-30').map((i) => [i.subscription.name, i.amount]),
    ).toEqual([
      ['A', 1590],
      ['B', 1000],
    ]);
  });

  it('ranks by period amount with ratios', () => {
    const ranking = spendingRanking(subs, [], {}, 'month', '2025-10-17');
    expect(ranking.map((r) => r.subscription.name)).toEqual(['A', 'B', 'C']);
    expect(ranking.reduce((s, r) => s + r.ratio, 0)).toBeCloseTo(1);
  });

  it('forecasts the next 12 months by billing dates', () => {
    // A: 12回（10/20〜翌9/20）、B: 1回（3/1）、C: 12回（11/1〜翌10/1）
    expect(yearlyBillingForecast(subs, [], {}, '2025-10-17')).toBe(1590 * 12 + 12000 + 150 * 12);
  });

  it('lists this month billings in date order', () => {
    expect(
      thisMonthBillings(subs, [], {}, '2025-10-17').map((e) => [e.date, e.subscription.name]),
    ).toEqual([
      ['2025-10-01', 'C'],
      ['2025-10-20', 'A'],
    ]);
  });
});

describe('planPaymentSync', () => {
  const sub = makeSub({ id: 's', amountMinor: 1000, startDate: '2025-07-15' });
  const payment = (over: Partial<Payment>): Payment => ({
    id: 'p',
    subscriptionId: 's',
    billedOn: '2025-07-15',
    amountMinor: 1000,
    currency: 'JPY',
    status: 'paid',
    isUserEdited: false,
    createdAt: '',
    updatedAt: '',
    ...over,
  });

  it('creates paid rows for billing dates up to today', () => {
    const plan = planPaymentSync(sub, [], [], '2025-10-17');
    expect(plan.toInsert.map((d) => d.billedOn)).toEqual([
      '2025-07-15',
      '2025-08-15',
      '2025-09-15',
      '2025-10-15',
    ]);
    expect(plan.toDeleteIds).toEqual([]);
  });

  it('does not recreate skipped rows and keeps user edits', () => {
    const existing = [
      payment({ id: 'x', billedOn: '2025-07-15', status: 'skipped' }),
      payment({ id: 'y', billedOn: '2025-08-16', isUserEdited: true }),
      payment({ id: 'z', billedOn: '2025-09-01' }),
    ];
    const plan = planPaymentSync(sub, [], existing, '2025-10-17');
    expect(plan.toInsert.map((d) => d.billedOn)).toEqual([
      '2025-08-15',
      '2025-09-15',
      '2025-10-15',
    ]);
    expect(plan.toDeleteIds).toEqual(['z']);
    expect(visiblePayments(existing).map((p) => p.id)).toEqual(['z', 'y']);
  });

  it('uses the price at each billing date', () => {
    const history: PriceHistoryEntry[] = [
      {
        id: 'h1',
        subscriptionId: 's',
        amountMinor: 800,
        currency: 'JPY',
        cycle: monthly,
        effectiveFrom: '2025-07-15',
      },
      {
        id: 'h2',
        subscriptionId: 's',
        amountMinor: 1000,
        currency: 'JPY',
        cycle: monthly,
        effectiveFrom: '2025-09-01',
      },
    ];
    expect(
      planPaymentSync(sub, history, [], '2025-10-17').toInsert.map((d) => d.amountMinor),
    ).toEqual([800, 800, 1000, 1000]);
  });
});
