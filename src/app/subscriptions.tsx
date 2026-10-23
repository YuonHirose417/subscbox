import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Chip,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  Screen,
  ScreenHeader,
  SearchField,
  Skeleton,
} from '@/components/ui';
import { useCategories } from '@/features/categories/store';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';
import { SORT_LABELS, showSortMenu } from '@/features/subscriptions/components/sortMenu';
import { SubscriptionRow } from '@/features/subscriptions/components/SubscriptionRow';
import { SwipeToDelete } from '@/features/subscriptions/components/SwipeToDelete';
import { confirmDeleteSubscription } from '@/features/subscriptions/confirmDelete';
import { useSubscriptionList } from '@/features/subscriptions/hooks/useSubscriptionList';
import { useToday } from '@/features/subscriptions/hooks/useToday';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { ja } from '@/i18n/ja';
import { useTheme } from '@/theme';

export default function SubscriptionsScreen() {
  const { spacing, colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const categories = useCategories();
  const status = useSubscriptionStore((s) => s.status);
  const load = useSubscriptionStore((s) => s.load);
  const rates = useSettingsStore((s) => s.exchangeRates);
  const setSortOrder = useSettingsStore((s) => s.setSortOrder);
  const { isPremium } = usePremium();
  const today = useToday();
  const t = ja.screens.subscriptions;

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const { items, sortOrder } = useSubscriptionList({ query, categoryId, includeCancelled });

  const openAdd = () => router.push('/add');
  const clearFilters = () => {
    setQuery('');
    setCategoryId(null);
  };

  const openSortMenu = () =>
    showSortMenu({
      current: sortOrder,
      isPremium,
      includeCancelled,
      onSort: setSortOrder,
      onToggleCancelled: () => setIncludeCancelled((v) => !v),
      onRequirePremium: () =>
        Alert.alert(
          'プレミアムプランの機能です',
          '更新日順・金額順などの並び替えは、プレミアムプランで利用できます。',
        ),
    });

  return (
    <Screen scroll={false} contentStyle={{ paddingBottom: 0, gap: spacing.sm }}>
      <ScreenHeader
        showBack
        title={t.title}
        trailing={
          <IconButton
            icon="plus"
            fallback="add"
            variant="gradient"
            accessibilityLabel="サブスクを追加"
            onPress={openAdd}
          />
        }
      />
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={t.searchPlaceholder}
        trailing={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`並び替え：${SORT_LABELS[sortOrder]}`}
            hitSlop={10}
            onPress={openSortMenu}
            style={styles.sortButton}>
            <Icon
              name="arrow.up.arrow.down"
              fallback="swap-vertical"
              size={15}
              color={colors.textTertiary}
            />
          </Pressable>
        }
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.chips, { marginHorizontal: -spacing.screen }]}
        contentContainerStyle={{ gap: spacing.xs, paddingHorizontal: spacing.screen }}>
        <Chip label="すべて" selected={categoryId === null} onPress={() => setCategoryId(null)} />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={categoryId === c.id}
            onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
          />
        ))}
      </ScrollView>

      {status === 'error' ? (
        <ErrorState onRetry={load} />
      ) : status !== 'ready' ? (
        <View style={{ gap: spacing.md, paddingTop: spacing.sm }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={56} radius={radius.icon} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          style={{ marginHorizontal: -spacing.screen }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + spacing.xxl,
            flexGrow: 1,
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            query || categoryId ? (
              <EmptyState
                icon="magnifyingglass"
                title={ja.empty.searchTitle}
                actionLabel={ja.common.clear}
                onAction={clearFilters}
              />
            ) : (
              <EmptyState
                icon="tray"
                title={ja.empty.homeTitle}
                description={ja.empty.homeBody}
                actionLabel={ja.empty.homeAction}
                onAction={openAdd}
              />
            )
          }
          renderItem={({ item, index }) => (
            <SwipeToDelete onDelete={() => confirmDeleteSubscription(item)}>
              <View
                style={{ backgroundColor: colors.background, paddingHorizontal: spacing.screen }}>
                <SubscriptionRow
                  subscription={item}
                  today={today}
                  rates={rates}
                  separator={index < items.length - 1}
                  onPress={() =>
                    router.push({ pathname: '/subscription/[id]', params: { id: item.id } })
                  }
                />
              </View>
            </SwipeToDelete>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sortButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  chips: { flexGrow: 0 },
});
