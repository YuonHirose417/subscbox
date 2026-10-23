import {
  formatMinor,
  formatMoney,
  fromMinor,
  parseAmountInput,
  toJpy,
  toMinor,
} from '@/domain/money';

describe('money', () => {
  it('converts between minor and major units', () => {
    expect(fromMinor(999, 'USD')).toBe(9.99);
    expect(fromMinor(1590, 'JPY')).toBe(1590);
    expect(toMinor(9.99, 'USD')).toBe(999);
    expect(toMinor(1.005, 'JPY')).toBe(1);
  });

  it('formats money with grouping and rounding', () => {
    expect(formatMoney(12340)).toBe('¥12,340');
    expect(formatMoney(1234.5)).toBe('¥1,235');
    expect(formatMoney(0.4)).toBe('¥0');
    expect(formatMoney(-0.4)).toBe('¥0');
    expect(formatMoney(2100, 'JPY', { signed: true })).toBe('+¥2,100');
    expect(formatMoney(-2100, 'JPY', { signed: true })).toBe('-¥2,100');
    expect(formatMoney(9999999)).toBe('¥9,999,999');
    expect(formatMinor(999, 'USD')).toBe('$9.99');
    expect(formatMinor(100000, 'EUR')).toBe('€1,000.00');
  });

  it('parses user input', () => {
    expect(parseAmountInput('1,590', 'JPY')).toBe(1590);
    expect(parseAmountInput('１５９０', 'JPY')).toBe(1590);
    expect(parseAmountInput('9.99', 'USD')).toBe(999);
    expect(parseAmountInput('9.999', 'USD')).toBeNull();
    expect(parseAmountInput('15.5', 'JPY')).toBeNull();
    expect(parseAmountInput('abc', 'JPY')).toBeNull();
    expect(parseAmountInput('', 'JPY')).toBeNull();
  });

  it('converts to JPY with user rates', () => {
    expect(toJpy(100, 'JPY', {})).toBe(100);
    expect(toJpy(10, 'USD', { USD: 150 })).toBe(1500);
    expect(toJpy(10, 'USD', {})).toBeNull();
    expect(toJpy(10, 'USD', { USD: 0 })).toBeNull();
  });
});
