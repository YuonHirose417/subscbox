import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  FormRow,
  Icon,
  ListRow,
  Sheet,
  TextField,
  type IconName,
} from '@/components/ui';
import { useCategories, useCategoryStore } from '@/features/categories/store';
import { FREE_LIMITS } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/usePremium';
import { customColorChoices, useTheme, withAlpha } from '@/theme';
import { isAppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

import { ColorChoices } from './ColorChoices';

type Props = {
  visible: boolean;
  value: string;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
};

/** カテゴリ選択シート。自作カテゴリの追加もここから（無料版は3件まで） */
export function CategoryPickerSheet({ visible, value, onSelect, onClose }: Props) {
  const { spacing, accent } = useTheme();
  const categories = useCategories();
  const createCategory = useCategoryStore((s) => s.create);
  const { isPremium } = usePremium();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(customColorChoices[0]);
  const customCount = categories.filter((c) => !c.isDefault).length;

  const submit = async () => {
    try {
      const created = await createCategory({ name, color, icon: 'tag.fill' }, isPremium);
      setAdding(false);
      setName('');
      onSelect(created.id);
      onClose();
    } catch (error) {
      logger.error('failed to create category', error);
      Alert.alert(
        'カテゴリを追加できませんでした',
        isAppError(error) && error.code === 'VALIDATION' ? error.message : 'もう一度お試しください',
      );
    }
  };

  return (
    <Sheet visible={visible} title="カテゴリ" onClose={onClose}>
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        {categories.map((c, index) => (
          <ListRow
            key={c.id}
            title={c.name}
            leading={
              <View style={[styles.icon, { backgroundColor: withAlpha(c.color, 0.14) }]}>
                <Icon name={c.icon as IconName} fallback="pricetag" size={15} color={c.color} />
              </View>
            }
            trailing={
              c.id === value ? (
                <Icon
                  name="checkmark"
                  fallback="checkmark"
                  size={16}
                  color={accent.primary}
                  weight="semibold"
                />
              ) : null
            }
            showChevron={false}
            separator={index < categories.length - 1}
            accessibilityLabel={`${c.name}${c.id === value ? '、選択中' : ''}`}
            onPress={() => {
              onSelect(c.id);
              onClose();
            }}
          />
        ))}
      </Card>

      {adding ? (
        <Card padding={0} style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
          <FormRow label="カテゴリ名" separator>
            <TextField
              value={name}
              onChangeText={setName}
              placeholder="例：学習"
              maxLength={20}
              autoFocus
            />
          </FormRow>
          <FormRow label="色" stacked>
            <ColorChoices value={color} onChange={setColor} />
          </FormRow>
          <Button title="追加する" size="sm" disabled={name.trim().length === 0} onPress={submit} />
        </Card>
      ) : (
        <Button
          title="カテゴリを追加"
          variant="secondary"
          size="sm"
          icon="plus"
          onPress={() => setAdding(true)}
        />
      )}
      {!isPremium ? (
        <AppText variant="caption" tone="tertiary" style={styles.center}>
          無料版で追加できるカテゴリは{FREE_LIMITS.customCategories}件までです（現在{customCount}
          件）
        </AppText>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  icon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
