import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { Screen } from '@/components/ui';
import { popularServicesByKey } from '@/data/popularServices';
import { today as todayString } from '@/domain/dates';
import { reachedSubscriptionLimit, SUBSCRIPTION_LIMIT_REASON } from '@/features/premium/gate';
import { LimitReachedError } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';
import { ModalHeader } from '@/features/subscriptions/components/ModalHeader';
import { valuesForCustom, valuesFromPreset } from '@/features/subscriptions/form/formValues';
import { SubscriptionForm } from '@/features/subscriptions/form/SubscriptionForm';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { useTheme } from '@/theme';

/** サブスクを追加：入力フォーム（プリセット or カスタム） */
export default function AddFormScreen() {
  const params = useLocalSearchParams<{
    serviceKey?: string;
    name?: string;
    categoryId?: string;
  }>();
  const navigation = useNavigation();
  const { spacing } = useTheme();
  const createSubscription = useSubscriptionStore((s) => s.create);
  const { isPremium } = usePremium();
  const notificationDefaults = useSettingsStore((s) => s.notificationDefaults);
  const [today] = useState(todayString);

  const preset = params.serviceKey ? popularServicesByKey[params.serviceKey] : undefined;
  const [initialValues] = useState(() =>
    preset
      ? valuesFromPreset(preset, preset.plans[0], notificationDefaults, today)
      : valuesForCustom(
          params.name ?? '',
          params.categoryId ?? 'other',
          notificationDefaults,
          today,
        ),
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={24}>
      <Screen
        topInset={false}
        contentStyle={{ gap: spacing.md }}
        scrollProps={{ keyboardShouldPersistTaps: 'handled', keyboardDismissMode: 'interactive' }}>
        <ModalHeader
          title={preset ? preset.name : 'カスタムで追加'}
          leading="back"
          onLeadingPress={() => router.back()}
        />
        <SubscriptionForm
          initialValues={initialValues}
          submitLabel="保存する"
          today={today}
          onSubmit={async (input) => {
            // 追加画面を開いたあとに上限に達した場合の保険（通常は開く前にペイウォールを出す）
            if (reachedSubscriptionLimit(useSubscriptionStore.getState().items, isPremium)) {
              throw new LimitReachedError(SUBSCRIPTION_LIMIT_REASON);
            }
            await createSubscription(input);
            // 追加モーダル全体を閉じる（親のルートスタックで戻る）
            navigation.getParent()?.goBack();
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
