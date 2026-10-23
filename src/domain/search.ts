import { monthlyJpy } from './billing';
import { compareDate } from './dates';
import type { Category, ExchangeRates, SortOrder, Subscription } from './types';

/**
 * 検索用の正規化：全角半角（NFKC）・大文字小文字・ひらがな/カタカナを区別しない。
 * ひらがなはカタカナに寄せる。
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
    .replace(/\s+/g, ' ')
    .trim();
}

export type SubscriptionFilter = {
  query: string;
  /** null = すべて */
  categoryId: string | null;
  includeCancelled: boolean;
};

export function filterSubscriptions(
  subs: readonly Subscription[],
  categories: readonly Category[],
  filter: SubscriptionFilter,
): Subscription[] {
  const q = normalizeForSearch(filter.query);
  const names = new Map(categories.map((c) => [c.id, c.name]));
  return subs.filter((sub) => {
    if (!filter.includeCancelled && sub.status === 'cancelled') return false;
    if (filter.categoryId && sub.categoryId !== filter.categoryId) return false;
    if (!q) return true;
    const haystack = normalizeForSearch(
      [sub.name, sub.planName ?? '', names.get(sub.categoryId) ?? ''].join(' '),
    );
    return haystack.includes(q);
  });
}

const collator = new Intl.Collator('ja');

/** 並び替え。同順位は登録順で安定させる。外貨でレート未設定のものは金額順の末尾 */
export function sortSubscriptions(
  subs: readonly Subscription[],
  order: SortOrder,
  rates: ExchangeRates,
): Subscription[] {
  const byCreated = (a: Subscription, b: Subscription) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  const amount = (s: Subscription) => monthlyJpy(s, rates);

  const compare = (a: Subscription, b: Subscription): number => {
    switch (order) {
      case 'created':
        return 0;
      case 'renewal':
        return compareDate(a.nextRenewalDate, b.nextRenewalDate);
      case 'name':
        return collator.compare(a.name, b.name);
      case 'amountDesc':
      case 'amountAsc': {
        const x = amount(a);
        const y = amount(b);
        if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
        return order === 'amountDesc' ? y - x : x - y;
      }
    }
  };

  return [...subs].sort((a, b) => compare(a, b) || byCreated(a, b));
}
