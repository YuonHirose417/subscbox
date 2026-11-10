import { defaultCategories } from '@/data/defaultCategories';
import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  createBackup,
  parseBackup,
  summarizeBackup,
  type BackupData,
} from '@/domain/backup';
import { escapeCsvCell, paymentsCsv, subscriptionsCsv, toCsv } from '@/domain/csv';
import type { Payment, PaymentMethod } from '@/domain/types';

import { makeSub } from './fixtures';

const method: PaymentMethod = {
  id: 'pm1',
  type: 'credit_card',
  label: null,
  last4: '1234',
  sortOrder: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'p1',
    subscriptionId: 's1',
    billedOn: '2025-09-15',
    amountMinor: 1590,
    currency: 'JPY',
    status: 'paid',
    isUserEdited: false,
    createdAt: '2025-09-15T00:00:00.000Z',
    updatedAt: '2025-09-15T00:00:00.000Z',
    ...overrides,
  };
}

function sample(): BackupData {
  const sub = makeSub({ id: 's1', name: 'Netflix', amountMinor: 1590, paymentMethodId: 'pm1' });
  return {
    categories: [...defaultCategories, { ...defaultCategories[0], id: 'mine', isDefault: false }],
    paymentMethods: [{ ...method }],
    subscriptions: [sub],
    priceHistory: [
      {
        id: 'h1',
        subscriptionId: 's1',
        amountMinor: 1590,
        currency: 'JPY',
        cycle: { unit: 'month', interval: 1 },
        effectiveFrom: '2025-01-15',
      },
    ],
    payments: [payment(), payment({ id: 'p2', billedOn: '2025-08-15', status: 'skipped' })],
    settings: { themePreference: 'dark', exchangeRates: { USD: 150 } },
  };
}

const serialize = (data: BackupData) =>
  JSON.stringify(createBackup(data, new Date('2025-10-17T00:00:00.000Z')));

describe('createBackup / parseBackup', () => {
  it('round-trips a backup', () => {
    const data = sample();
    const file = createBackup(data, new Date('2025-10-17T00:00:00.000Z'));
    expect(file.format).toBe(BACKUP_FORMAT);
    expect(file.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed).toEqual({ ok: true, data });
  });

  it('rejects files that are not backups', () => {
    expect(parseBackup('not json')).toMatchObject({ ok: false });
    expect(parseBackup('{"foo":1}')).toEqual({
      ok: false,
      errors: ['SubscBoxのバックアップファイルではありません'],
    });
    expect(
      parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 99, data: {} })),
    ).toMatchObject({ ok: false, errors: [expect.stringContaining('アプリを更新')] });
    expect(parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 1 }))).toMatchObject({
      ok: false,
    });
  });

  it('rejects invalid values', () => {
    const cases: ((d: BackupData) => void)[] = [
      (d) => (d.subscriptions[0].amountMinor = -1),
      (d) => (d.subscriptions[0].startDate = '2025-02-30'),
      (d) => ((d.subscriptions[0] as { currency: string }).currency = 'XXX'),
      (d) => (d.subscriptions[0].icon = { type: 'image', value: '../../etc/passwd', color: null }),
      (d) => (d.paymentMethods[0].last4 = '12345678'),
      (d) => ((d.payments[0] as { status: string }).status = 'unknown'),
      (d) => (d.priceHistory[0].effectiveFrom = 'yesterday'),
      (d) => (d.categories[0] = { ...d.categories[0], name: '' }),
      (d) => ((d as { settings: unknown }).settings = []),
    ];
    for (const mutate of cases) {
      const data = sample();
      mutate(data);
      expect(parseBackup(serialize(data)).ok).toBe(false);
    }
  });

  it('restores old backups that still contain a URL or memo', () => {
    const data = sample();
    data.subscriptions[0].url = 'ftp://example.com';
    data.subscriptions[0].memo = 'x'.repeat(501);
    expect(parseBackup(serialize(data)).ok).toBe(true);
  });

  it('rejects broken references and duplicates', () => {
    const cases: ((d: BackupData) => void)[] = [
      (d) => (d.subscriptions[0].categoryId = 'missing'),
      (d) => (d.subscriptions[0].paymentMethodId = 'missing'),
      (d) => (d.priceHistory[0].subscriptionId = 'missing'),
      (d) => (d.payments[0].subscriptionId = 'missing'),
      (d) => d.subscriptions.push({ ...d.subscriptions[0] }),
      (d) => d.payments.push(payment({ id: 'p3' })),
    ];
    for (const mutate of cases) {
      const data = sample();
      mutate(data);
      const result = parseBackup(serialize(data));
      expect(result.ok).toBe(false);
    }
  });

  it('summarizes counts', () => {
    expect(summarizeBackup(sample())).toBe(
      'サブスク 1件、支払い履歴 1件、支払い方法 1件、自作カテゴリ 1件',
    );
  });
});

describe('csv', () => {
  it('escapes cells and neutralizes formulas', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(12.5)).toBe('12.5');
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line\nbreak')).toBe('"line\nbreak"');
    expect(escapeCsvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(escapeCsvCell(-5)).toBe('-5');
  });

  it('adds a BOM and CRLF line endings', () => {
    expect(
      toCsv([
        ['a', 'b'],
        [1, null],
      ]),
    ).toBe('﻿a,b\r\n1,\r\n');
  });

  it('exports subscriptions and payments', () => {
    const data = sample();
    const usd = makeSub({
      id: 's2',
      name: 'ChatGPT',
      amountMinor: 2000,
      currency: 'USD',
      cycle: { unit: 'year', interval: 1 },
      planName: 'Plus, Team',
      url: 'https://chatgpt.com/',
      memo: 'メモ',
    });
    const csv = subscriptionsCsv(
      [...data.subscriptions, usd],
      data.categories,
      data.paymentMethods,
      {},
    );
    const lines = csv.slice(1).trim().split('\r\n');
    expect(lines[0].split(',')[0]).toBe('サービス名');
    expect(lines[0]).not.toMatch(/URL|メモ/);
    expect(lines[1]).toContain('Netflix,,1590,JPY,毎月,1590');
    expect(lines[1]).toContain('クレジットカード（****1234）');
    expect(lines[2]).toContain('ChatGPT,"Plus, Team",20,USD,毎年,,');
    expect(lines[2]).not.toMatch(/chatgpt.com|メモ/);

    const pay = paymentsCsv(data.payments, data.subscriptions).slice(1).trim().split('\r\n');
    expect(pay).toEqual([
      '支払日,サービス名,金額,通貨,記録',
      '2025-09-15,Netflix,1590,JPY,自動記録',
    ]);
  });
});
