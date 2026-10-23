import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { today as todayString } from '@/domain/dates';
import { valuesFromSubscription } from '@/features/subscriptions/form/formValues';
import { SubscriptionForm } from '@/features/subscriptions/form/SubscriptionForm';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { useTheme } from '@/theme';

/** サブスクの編集（入力フォームは追加と共通） */
export default function EditSubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing } = useTheme();
  const sub = useSubscriptionStore((s) => s.items.find((item) => item.id === id));
  const updateSubscription = useSubscriptionStore((s) => s.update);
  const [today] = useState(todayString);
  const [initialValues] = useState(() => (sub ? valuesFromSubscription(sub) : null));

  if (!sub || !initialValues) {
    return (
      <Screen>
        <ScreenHeader showBack title="" />
        <EmptyState icon="questionmark.folder" title="サブスクが見つかりませんでした" />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        contentStyle={{ gap: spacing.md }}
        scrollProps={{ keyboardShouldPersistTaps: 'handled', keyboardDismissMode: 'interactive' }}>
        <ScreenHeader showBack title="編集" />
        <SubscriptionForm
          initialValues={initialValues}
          submitLabel="変更を保存"
          today={today}
          onSubmit={async (input) => {
            await updateSubscription(sub.id, input);
            router.back();
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
