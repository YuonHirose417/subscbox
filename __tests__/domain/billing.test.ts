import {
  billedTotalJpy,
  billingDatesInRange,
  cycleSuffix,
  daysUntil,
  defaultNextRenewal,
  firstBillingOnOrAfter,
  isActiveOn,
  monthlyEquivalent,
  monthlyJpy,
  priceAt,
  rollForwardRenewal,
  yearlyEquivalent,
} from '@/domain/billing';

import { makeSub } from './fixtures';

describe('monthlyEquivalent / yearlyEquivalent', () => {
  it('handles week / month / year and N intervals', () => {
    expect(monthlyEquivalent(1200, { unit: 'month', interval: 1 })).toBe(1200);
    expect(monthlyEquivalent(3000, { unit: 'month', interval: 3 })).toBe(1000);
    expect(monthlyEquivalent(12000, { unit: 'year', interval: 1 })).toBe(1000);
    expect(monthlyEquivalent(24000, { unit: 'year', interval: 2 })).toBe(1000);
    expect(monthlyEquivalent(300, { unit: 'week', interval: 1 })).toBe(1300);
    expect(monthlyEquivalent(600, { unit: 'week', interval: 2 })).toBe(1300);
    expect(yearlyEquivalent(1590, { unit: 'month', interval: 1 })).toBe(19080);
    expect(yearlyEquivalent(300, { unit: 'week', interval: 1 })).toBeCloseTo(15600);
  });

  it('keeps fractions internally', () => {
    expect(monthlyEquivalent(1000, { unit: 'year', interval: 1 })).toBeCloseTo(83.3333, 3);
  });

  it('converts foreign currency or returns null without a rate', () => {
    const usd = makeSub({ amountMinor: 999, currency: 'USD' });
    expect(monthlyJpy(usd, { USD: 150 })).toBeCloseTo(1498.5);
    expect(monthlyJpy(usd, {})).toBeNull();
  });
});

describe('renewal dates', () => {
  const monthly = { unit: 'month', interval: 1 } as const;

  it('defaults next renewal to start + 1 cycle', () => {
    expect(defaultNextRenewal('2025-01-31', monthly)).toBe('2025-02-28');
    expect(defaultNextRenewal('2024-02-29', { unit: 'year', interval: 1 })).toBe('2025-02-28');
  });

  it('finds the first billing on or after a date', () => {
    expect(firstBillingOnOrAfter('2025-01-31', monthly, '2025-04-01')).toBe('2025-04-30');
    expect(firstBillingOnOrAfter('2025-01-31', monthly, '2025-03-31')).toBe('2025-03-31');
    expect(firstBillingOnOrAfter('2025-01-15', monthly, '2024-12-01')).toBe('2025-01-15');
    expect(firstBillingOnOrAfter('2025-01-15', monthly, '2024-12-01', 1)).toBe('2025-02-15');
    expect(firstBillingOnOrAfter('2000-01-01', { unit: 'week', interval: 1 }, '2025-10-20')).toBe(
      '2025-10-25',
    );
  });

  it('rolls forward past renewals based on the start date (no month-end drift)', () => {
    const sub = makeSub({ startDate: '2025-01-31', nextRenewalDate: '2025-02-28' });
    expect(rollForwardRenewal(sub, '2025-03-01')).toBe('2025-03-31');
    expect(rollForwardRenewal(sub, '2025-04-15')).toBe('2025-04-30');
    expect(rollForwardRenewal({ ...sub, nextRenewalDate: '2025-05-31' }, '2025-04-15')).toBe(
      '2025-05-31',
    );
    // 当日は繰り越さない
    expect(rollForwardRenewal({ ...sub, nextRenewalDate: '2025-04-30' }, '2025-04-30')).toBe(
      '2025-04-30',
    );
  });

  it('handles leap years', () => {
    const sub = makeSub({
      startDate: '2024-02-29',
      nextRenewalDate: '2025-02-28',
      cycle: { unit: 'year', interval: 1 },
    });
    expect(rollForwardRenewal(sub, '2025-03-01')).toBe('2026-02-28');
    expect(rollForwardRenewal(sub, '2027-03-01')).toBe('2028-02-29');
  });

  it('counts days left from today=0', () => {
    expect(daysUntil('2025-10-17', '2025-10-17')).toBe(0);
    expect(daysUntil('2025-10-20', '2025-10-17')).toBe(3);
  });

  it('formats cycle suffixes', () => {
    expect(cycleSuffix(monthly)).toBe('/月');
    expect(cycleSuffix({ unit: 'year', interval: 1 })).toBe('/年');
    expect(cycleSuffix({ unit: 'week', interval: 1 })).toBe('/週');
    expect(cycleSuffix({ unit: 'month', interval: 3 })).toBe('/3か月');
    expect(cycleSuffix({ unit: 'week', interval: 2 })).toBe('/2週');
  });
});

describe('activity and price history', () => {
  it('checks whether a subscription was active on a date', () => {
    const sub = makeSub({ startDate: '2025-03-10' });
    expect(isActiveOn(sub, '2025-03-09')).toBe(false);
    expect(isActiveOn(sub, '2025-03-10')).toBe(true);
    const cancelled = {
      ...sub,
      status: 'cancelled' as const,
      cancelledAt: '2025-06-15T03:00:00.000Z',
    };
    expect(isActiveOn(cancelled, '2025-05-31')).toBe(true);
    expect(isActiveOn(cancelled, '2025-06-30')).toBe(false);
  });

  it('uses the price effective on a date', () => {
    const sub = makeSub({ id: 'p1', amountMinor: 1490 });
    const history = [
      {
        id: 'h1',
        subscriptionId: 'p1',
        amountMinor: 990,
        currency: 'JPY' as const,
        cycle: sub.cycle,
        effectiveFrom: '2025-01-15',
      },
      {
        id: 'h2',
        subscriptionId: 'p1',
        amountMinor: 1490,
        currency: 'JPY' as const,
        cycle: sub.cycle,
        effectiveFrom: '2025-06-01',
      },
      {
        id: 'h3',
        subscriptionId: 'other',
        amountMinor: 1,
        currency: 'JPY' as const,
        cycle: sub.cycle,
        effectiveFrom: '2025-01-01',
      },
    ];
    expect(priceAt(sub, history, '2025-05-31').amountMinor).toBe(990);
    expect(priceAt(sub, history, '2025-06-01').amountMinor).toBe(1490);
    expect(priceAt(sub, [], '2025-06-01').amountMinor).toBe(1490);
  });
});

describe('billing date projection', () => {
  it('enumerates billing dates within a range', () => {
    const sub = makeSub({ startDate: '2025-01-31' });
    expect(billingDatesInRange(sub, '2025-01-01', '2025-04-30')).toEqual([
      '2025-01-31',
      '2025-02-28',
      '2025-03-31',
      '2025-04-30',
    ]);
    expect(billingDatesInRange(sub, '2025-05-01', '2025-04-01')).toEqual([]);
  });

  it('stops after cancellation', () => {
    const sub = makeSub({
      startDate: '2025-01-10',
      status: 'cancelled',
      cancelledAt: '2025-03-05T00:00:00.000Z',
    });
    expect(billingDatesInRange(sub, '2025-01-01', '2025-06-30')).toEqual([
      '2025-01-10',
      '2025-02-10',
    ]);
  });

  it('sums billed amounts with price history and rates', () => {
    const yearly = makeSub({
      id: 'y',
      amountMinor: 12000,
      cycle: { unit: 'year', interval: 1 },
      startDate: '2025-03-01',
    });
    const usd = makeSub({ id: 'u', amountMinor: 1000, currency: 'USD', startDate: '2025-01-05' });
    const total = billedTotalJpy([yearly, usd], [], { USD: 150 }, '2025-01-01', '2025-12-31');
    expect(total).toBe(12000 + 12 * 1500);
    expect(billedTotalJpy([usd], [], {}, '2025-01-01', '2025-12-31')).toBe(0);
  });
});
