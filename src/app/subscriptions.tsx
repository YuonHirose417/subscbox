import { useState } from 'react';

import { EmptyState, IconButton, Screen, ScreenHeader, SearchField } from '@/components/ui';
import { ja } from '@/i18n/ja';

/** サブスク一覧（フェーズ1はプレースホルダー。本実装はフェーズ2） */
export default function SubscriptionsScreen() {
  const [query, setQuery] = useState('');
  const t = ja.screens.subscriptions;

  return (
    <Screen>
      <ScreenHeader
        showBack
        title={t.title}
        trailing={
          <IconButton
            icon="plus"
            fallback="add"
            variant="gradient"
            accessibilityLabel="サブスクを追加"
          />
        }
      />
      <SearchField value={query} onChangeText={setQuery} placeholder={t.searchPlaceholder} />
      <EmptyState icon="magnifyingglass" title={ja.empty.searchTitle} />
    </Screen>
  );
}
