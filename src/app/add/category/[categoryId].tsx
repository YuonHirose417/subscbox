import { router, useLocalSearchParams } from 'expo-router';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { useCategories } from '@/features/categories/store';
import { ModalHeader } from '@/features/subscriptions/components/ModalHeader';
import { PresetRow } from '@/features/subscriptions/components/PresetRow';
import { presetsInCategory } from '@/features/subscriptions/presets';
import { useTheme } from '@/theme';

/** カテゴリから探す → そのカテゴリの人気サービス一覧 */
export default function AddByCategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { spacing } = useTheme();
  const category = useCategories().find((c) => c.id === categoryId);
  const presets = presetsInCategory(categoryId);

  return (
    <Screen topInset={false} contentStyle={{ gap: spacing.md }}>
      <ModalHeader
        title={category?.name ?? 'カテゴリ'}
        leading="back"
        onLeadingPress={() => router.back()}
      />
      {presets.length > 0 ? (
        <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
          {presets.map((preset, index) => (
            <PresetRow
              key={preset.key}
              preset={preset}
              separator={index < presets.length - 1}
              onPress={() =>
                router.push({ pathname: '/add/form', params: { serviceKey: preset.key } })
              }
            />
          ))}
        </Card>
      ) : (
        <AppText variant="body" tone="secondary">
          このカテゴリの人気サービスはまだありません
        </AppText>
      )}
      <Button
        title="カスタムで追加する"
        variant="soft"
        onPress={() => router.push({ pathname: '/add/form', params: { name: '', categoryId } })}
      />
    </Screen>
  );
}
