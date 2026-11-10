import { toInput } from '@/domain/subscription';
import { validateSubscriptionInput } from '@/domain/validation';

import { makeSub } from './fixtures';

const valid = () => toInput(makeSub());

describe('validateSubscriptionInput', () => {
  it('accepts a valid input', () => {
    expect(validateSubscriptionInput(valid())).toEqual({});
  });

  it('reports each invalid field', () => {
    const errors = validateSubscriptionInput({
      ...valid(),
      name: '',
      planName: 'x'.repeat(51),
      amountMinor: 0,
      cycle: { unit: 'month', interval: 0 },
      startDate: '2025-02-30',
      notification: { enabled: true, daysBefore: 3, time: '25:00' },
    });
    expect(Object.keys(errors).sort()).toEqual(
      [
        'amountMinor',
        'cycle',
        'name',
        'notification',
        'planName',
        'startDate',
      ].sort(),
    );
  });

  it('limits name length and amount', () => {
    expect(validateSubscriptionInput({ ...valid(), name: 'x'.repeat(51) }).name).toBeDefined();
    expect(validateSubscriptionInput({ ...valid(), amountMinor: 10_000_000 }).amountMinor).toBe(
      '金額が大きすぎます',
    );
    expect(validateSubscriptionInput({ ...valid(), amountMinor: 9_999_999 })).toEqual({});
    expect(
      validateSubscriptionInput({ ...valid(), currency: 'USD', amountMinor: 999_999_900 }),
    ).toEqual({});
  });

  it('ignores URL and memo (the fields are no longer used)', () => {
    const legacy = { ...valid(), url: 'javascript:alert(1)', memo: 'x'.repeat(501) };
    expect(validateSubscriptionInput(legacy)).toEqual({});
  });
});
