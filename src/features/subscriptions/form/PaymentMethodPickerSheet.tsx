import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  FormRow,
  Icon,
  ListRow,
  Sheet,
  TextField,
} from '@/components/ui';
import { formatPaymentMethod, paymentMethodTypeLabels } from '@/domain/paymentMethod';
import type { PaymentMethodType } from '@/domain/types';
import { usePaymentMethodStore } from '@/features/paymentMethods/store';
import { FREE_LIMITS } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/usePremium';
import { useTheme } from '@/theme';
import { isAppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

type Props = {
  visible: boolean;
  value: string | null;
  onSelect: (paymentMethodId: string | null) => void;
  onClose: () => void;
};

const TYPES = Object.keys(paymentMethodTypeLabels) as PaymentMethodType[];
const HAS_CARD_NUMBER: PaymentMethodType[] = ['credit_card', 'debit_card'];

/**
 * 支払い方法の選択シート。登録もここから（無料版は2件まで）。
 * カード番号は下4桁のみ入力させる。
 */
export function PaymentMethodPickerSheet({ visible, value, onSelect, onClose }: Props) {
  const { spacing, accent } = useTheme();
  const items = usePaymentMethodStore((s) => s.items);
  const createMethod = usePaymentMethodStore((s) => s.create);
  const { isPremium } = usePremium();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<PaymentMethodType>('credit_card');
  const [label, setLabel] = useState('');
  const [last4, setLast4] = useState('');

  const needsLast4 = HAS_CARD_NUMBER.includes(type);
  const last4Invalid = needsLast4 && last4.length > 0 && !/^\d{4}$/.test(last4);

  const submit = async () => {
    try {
      const created = await createMethod(
        { type, label: label.trim() || null, last4: needsLast4 && last4 ? last4 : null },
        isPremium,
      );
      setAdding(false);
      setLabel('');
      setLast4('');
      onSelect(created.id);
      onClose();
    } catch (error) {
      logger.error('failed to create payment method', error);
      Alert.alert(
        '支払い方法を追加できませんでした',
        isAppError(error) && error.code === 'VALIDATION' ? error.message : 'もう一度お試しください',
      );
    }
  };

  const check = (selected: boolean) =>
    selected ? (
      <Icon
        name="checkmark"
        fallback="checkmark"
        size={16}
        color={accent.primary}
        weight="semibold"
      />
    ) : null;

  return (
    <Sheet visible={visible} title="支払い方法" onClose={onClose}>
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <ListRow
          title="未設定"
          trailing={check(value === null)}
          showChevron={false}
          separator={items.length > 0}
          onPress={() => {
            onSelect(null);
            onClose();
          }}
        />
        {items.map((m, index) => (
          <ListRow
            key={m.id}
            title={formatPaymentMethod(m)}
            icon={
              m.type === 'apple_id' ? 'apple.logo' : m.type === 'carrier' ? 'iphone' : 'creditcard'
            }
            trailing={check(m.id === value)}
            showChevron={false}
            separator={index < items.length - 1}
            onPress={() => {
              onSelect(m.id);
              onClose();
            }}
          />
        ))}
      </Card>

      {adding ? (
        <Card padding={0} style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
          <FormRow label="種類" stacked separator>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.xs }}>
              {TYPES.map((t) => (
                <Chip
                  key={t}
                  label={paymentMethodTypeLabels[t]}
                  selected={t === type}
                  onPress={() => setType(t)}
                />
              ))}
            </ScrollView>
          </FormRow>
          <FormRow label="名前（任意）" separator>
            <TextField
              value={label}
              onChangeText={setLabel}
              placeholder="例：楽天カード"
              maxLength={30}
            />
          </FormRow>
          {needsLast4 ? (
            <FormRow
              label="下4桁（任意）"
              separator
              error={last4Invalid ? '数字4桁で入力してください' : null}
              hint="カード番号は下4桁以外を入力しないでください">
              <TextField
                value={last4}
                onChangeText={(t) => setLast4(t.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                keyboardType="number-pad"
                maxLength={4}
              />
            </FormRow>
          ) : null}
          <Button
            title="追加する"
            size="sm"
            disabled={last4Invalid}
            onPress={submit}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : (
        <Button
          title="支払い方法を追加"
          variant="secondary"
          size="sm"
          icon="plus"
          onPress={() => setAdding(true)}
        />
      )}
      {!isPremium ? (
        <AppText variant="caption" tone="tertiary" style={styles.center}>
          無料版で登録できる支払い方法は{FREE_LIMITS.paymentMethods}件までです（現在{items.length}
          件）
        </AppText>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
