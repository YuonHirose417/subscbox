import { filterSubscriptions, normalizeForSearch, sortSubscriptions } from '@/domain/search';
import type { Category } from '@/domain/types';

import { makeSub } from './fixtures';

const categories: Category[] = [
  { id: 'video_music', name: '動画・音楽', color: 'x', icon: 'x', sortOrder: 0, isDefault: true },
  { id: 'cloud', name: 'クラウド', color: 'x', icon: 'x', sortOrder: 1, isDefault: true },
];

const netflix = makeSub({
  name: 'Netflix',
  categoryId: 'video_music',
  amountMinor: 1590,
  nextRenewalDate: '2025-10-20',
  createdAt: '2025-01-01T00:00:01Z',
});
const icloud = makeSub({
  name: 'iCloud+',
  categoryId: 'cloud',
  amountMinor: 150,
  nextRenewalDate: '2025-11-06',
  createdAt: '2025-01-01T00:00:02Z',
});
const google = makeSub({
  name: 'Google One',
  planName: 'ベーシック',
  categoryId: 'cloud',
  amountMinor: 250,
  nextRenewalDate: '2025-11-05',
  createdAt: '2025-01-01T00:00:03Z',
});
const cancelled = makeSub({
  name: 'Hulu',
  categoryId: 'video_music',
  status: 'cancelled',
  cancelledAt: '2025-05-01T00:00:00Z',
  createdAt: '2025-01-01T00:00:04Z',
});
const all = [netflix, icloud, google, cancelled];

describe('normalizeForSearch', () => {
  it('ignores case, width and kana type', () => {
    expect(normalizeForSearch('ＮＥＴ')).toBe('net');
    expect(normalizeForSearch('くらうど')).toBe(normalizeForSearch('クラウド'));
    expect(normalizeForSearch('ｸﾗｳﾄﾞ')).toBe('クラウド');
  });
});

describe('filterSubscriptions', () => {
  const base = { query: '', categoryId: null, includeCancelled: false };

  it('searches by name, plan and category name', () => {
    expect(filterSubscriptions(all, categories, { ...base, query: 'net' })).toEqual([netflix]);
    expect(filterSubscriptions(all, categories, { ...base, query: 'くらうど' })).toEqual([
      icloud,
      google,
    ]);
    expect(filterSubscriptions(all, categories, { ...base, query: 'べーしっく' })).toEqual([
      google,
    ]);
  });

  it('combines category filter and query', () => {
    expect(filterSubscriptions(all, categories, { ...base, categoryId: 'cloud' })).toEqual([
      icloud,
      google,
    ]);
    expect(
      filterSubscriptions(all, categories, { ...base, categoryId: 'cloud', query: 'google' }),
    ).toEqual([google]);
    expect(
      filterSubscriptions(all, categories, { ...base, categoryId: 'video_music', query: 'google' }),
    ).toEqual([]);
  });

  it('hides cancelled by default', () => {
    expect(filterSubscriptions(all, categories, base)).not.toContain(cancelled);
    expect(filterSubscriptions(all, categories, { ...base, includeCancelled: true })).toContain(
      cancelled,
    );
  });
});

describe('sortSubscriptions', () => {
  const list = [netflix, icloud, google];
  it('sorts by each order', () => {
    expect(sortSubscriptions(list, 'created', {}).map((s) => s.name)).toEqual([
      'Netflix',
      'iCloud+',
      'Google One',
    ]);
    expect(sortSubscriptions(list, 'renewal', {}).map((s) => s.name)).toEqual([
      'Netflix',
      'Google One',
      'iCloud+',
    ]);
    expect(sortSubscriptions(list, 'amountDesc', {}).map((s) => s.name)).toEqual([
      'Netflix',
      'Google One',
      'iCloud+',
    ]);
    expect(sortSubscriptions(list, 'amountAsc', {}).map((s) => s.name)).toEqual([
      'iCloud+',
      'Google One',
      'Netflix',
    ]);
    expect(sortSubscriptions(list, 'name', {}).map((s) => s.name)[0]).toBe('Google One');
  });

  it('puts foreign subscriptions without a rate last for amount sorts', () => {
    const usd = makeSub({ name: 'USD', currency: 'USD', amountMinor: 99999 });
    expect(sortSubscriptions([usd, icloud], 'amountDesc', {}).map((s) => s.name)).toEqual([
      'iCloud+',
      'USD',
    ]);
    expect(sortSubscriptions([usd, icloud], 'amountDesc', { USD: 150 }).map((s) => s.name)).toEqual(
      ['USD', 'iCloud+'],
    );
  });
});
