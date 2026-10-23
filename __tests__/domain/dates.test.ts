import {
  addCycles,
  addDays,
  diffDays,
  endOfMonth,
  formatDaysLeft,
  formatFullDate,
  formatMonthDay,
  isDateString,
  parseDate,
  startOfMonth,
} from '@/domain/dates';

describe('dates', () => {
  it('parses and validates YYYY-MM-DD', () => {
    expect(parseDate('2025-10-20').getDate()).toBe(20);
    expect(isDateString('2025-02-29')).toBe(false);
    expect(isDateString('2024-02-29')).toBe(true);
    expect(isDateString('2025-1-01')).toBe(false);
    expect(() => parseDate('2025-13-01')).toThrow();
  });

  it('adds cycles from the base date (month-end safe)', () => {
    const monthly = { unit: 'month', interval: 1 } as const;
    expect(addCycles('2025-01-31', monthly, 1)).toBe('2025-02-28');
    expect(addCycles('2025-01-31', monthly, 2)).toBe('2025-03-31');
    expect(addCycles('2025-01-31', monthly, 3)).toBe('2025-04-30');
    expect(addCycles('2024-01-31', monthly, 1)).toBe('2024-02-29');
    expect(addCycles('2025-01-01', { unit: 'week', interval: 2 }, 3)).toBe('2025-02-12');
    expect(addCycles('2024-02-29', { unit: 'year', interval: 1 }, 1)).toBe('2025-02-28');
    expect(addCycles('2024-02-29', { unit: 'year', interval: 1 }, 4)).toBe('2028-02-29');
    expect(addCycles('2025-01-10', { unit: 'month', interval: 3 }, 2)).toBe('2025-07-10');
  });

  it('computes day differences and month bounds', () => {
    expect(diffDays('2025-10-17', '2025-10-20')).toBe(3);
    expect(diffDays('2025-10-20', '2025-10-17')).toBe(-3);
    expect(diffDays('2024-02-28', '2024-03-01')).toBe(2);
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(startOfMonth('2025-10-17')).toBe('2025-10-01');
    expect(endOfMonth('2024-02-10')).toBe('2024-02-29');
  });

  it('formats dates in Japanese', () => {
    expect(formatMonthDay('2025-10-20')).toBe('10月20日');
    expect(formatFullDate('2025-11-01')).toBe('2025年11月1日');
    expect(formatDaysLeft(0)).toBe('今日');
    expect(formatDaysLeft(1)).toBe('明日');
    expect(formatDaysLeft(3)).toBe('あと3日');
    expect(formatDaysLeft(-2)).toBe('2日前');
  });
});
