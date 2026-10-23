import { useEffect, useMemo, useState } from 'react';

import { filterSubscriptions, sortSubscriptions } from '@/domain/search';
import type { SortOrder, Subscription } from '@/domain/types';
import { useCategories } from '@/features/categories/store';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';

import { useSubscriptionStore } from '../store';

const SEARCH_DEBOUNCE_MS = 200;

type Options = {
  query: string;
  categoryId: string | null;
  includeCancelled: boolean;
};

/** 一覧の検索（200msデバウンス）・カテゴリ絞り込み・並び替え */
export function useSubscriptionList({ query, categoryId, includeCancelled }: Options): {
  items: Subscription[];
  /** 実際に適用している並び順（無料は登録順固定） */
  sortOrder: SortOrder;
} {
  const all = useSubscriptionStore((s) => s.items);
  const categories = useCategories();
  const rates = useSettingsStore((s) => s.exchangeRates);
  const preferred = useSettingsStore((s) => s.sortOrder);
  const { isPremium } = usePremium();
  const sortOrder: SortOrder = isPremium ? preferred : 'created';

  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const items = useMemo(() => {
    const filtered = filterSubscriptions(all, categories, {
      query: debounced,
      categoryId,
      includeCancelled,
    });
    return sortSubscriptions(filtered, sortOrder, rates);
  }, [all, categories, debounced, categoryId, includeCancelled, sortOrder, rates]);

  return { items, sortOrder };
}
