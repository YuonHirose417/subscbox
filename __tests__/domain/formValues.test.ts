import { popularServicesByKey } from '@/data/popularServices';
import { makeSub } from './fixtures';
import {
  suggestNextRenewal,
  toSubmission,
  valuesForCustom,
  valuesFromPreset,
  valuesFromSubscription,
} from '@/features/subscriptions/form/formValues';

const notify = { enabled: true, daysBefore: 3, time: '09:00' };
const monthly = { unit: 'month', interval: 1 } as const;

describe('suggestNextRenewal', () => {
  it('is start + 1 cycle for a new contract', () => {
    expect(suggestNextRenewal('2025-10-17', monthly, '2025-10-17')).toBe('2025-11-17');
    expect(suggestNextRenewal('2025-01-31', monthly, '2025-01-31')).toBe('2025-02-28');
  });

  it('rolls forward to the first renewal on or after today for an old contract', () => {
    expect(suggestNextRenewal('2025-01-31', monthly, '2025-04-15')).toBe('2025-04-30');
    expect(suggestNextRenewal('2024-02-29', { unit: 'year', interval: 1 }, '2025-10-17')).toBe(
      '2026-02-28',
    );
  });
});

describe('form values', () => {
  it('prefills from a preset plan as a reference price', () => {
    const v = valuesFromPreset(
      popularServicesByKey.netflix,
      popularServicesByKey.netflix.plans[1],
      notify,
      '2025-10-17',
    );
    expect(v).toMatchObject({
      serviceKey: 'netflix',
      name: 'Netflix',
      planName: 'スタンダードプラン',
      amountText: '1590',
      categoryId: 'video_music',
      nextRenewalDate: '2025-11-17',
      usesReferencePrice: true,
    });
    const { input, errors } = toSubmission(v, '#E50914');
    expect(errors).toEqual({});
    expect(input).toMatchObject({ amountMinor: 1590, icon: { color: '#E50914' } });
  });

  it('converts foreign amounts to minor units', () => {
    const v = valuesFromPreset(
      popularServicesByKey.chatgpt,
      popularServicesByKey.chatgpt.plans[0],
      notify,
      '2025-10-17',
    );
    expect(v.amountText).toBe('20');
    // ChatGPT はプラン名を決めず、参考価格だけを初期値にする
    expect(v.name).toBe('ChatGPT');
    expect(v.planName).toBe('');
    expect(v.usesReferencePrice).toBe(true);
    expect(toSubmission({ ...v, amountText: '19.99' }, null).input.amountMinor).toBe(1999);
  });

  it('reports required fields for an empty custom form', () => {
    const { errors } = toSubmission(valuesForCustom('', 'other', notify, '2025-10-17'), null);
    expect(errors.name).toBeDefined();
    expect(errors.amountMinor).toBe('金額を入力してください');
  });

  it('rejects malformed amounts and renewal before start', () => {
    const base = { ...valuesForCustom('X', 'other', notify, '2025-10-17'), amountText: '12.5' };
    expect(toSubmission(base, null).errors.amountMinor).toBe('金額は整数で入力してください');
    expect(toSubmission({ ...base, amountText: '0' }, null).errors.amountMinor).toBeDefined();
    expect(
      toSubmission({ ...base, amountText: '100', nextRenewalDate: '2025-10-01' }, null).errors
        .nextRenewalDate,
    ).toBeDefined();
  });

  it('round-trips an existing subscription', () => {
    const sub = makeSub({ name: 'Hulu', amountMinor: 1026, memo: 'メモ', url: 'https://hulu.jp' });
    const v = valuesFromSubscription(sub);
    expect(v.renewalEdited).toBe(true);
    const { input, errors } = toSubmission(v, null);
    expect(errors).toEqual({});
    expect(input).toMatchObject({ name: 'Hulu', amountMinor: 1026 });
    // URL・メモはフォームから保存しない（編集では元の値が残る）
    expect(input).not.toHaveProperty('url');
    expect(input).not.toHaveProperty('memo');
  });

  it('keeps a custom icon image and drops it when removed', () => {
    const sub = makeSub({ icon: { type: 'image', value: 'icons/a.jpg', color: null } });
    const v = valuesFromSubscription(sub);
    expect(v.iconImage).toBe('icons/a.jpg');
    expect(toSubmission(v, null).input.icon).toEqual({
      type: 'image',
      value: 'icons/a.jpg',
      color: null,
    });
    expect(toSubmission({ ...v, iconImage: null }, '#000000').input.icon).toEqual({
      type: 'monogram',
      value: null,
      color: '#000000',
    });
  });
});
