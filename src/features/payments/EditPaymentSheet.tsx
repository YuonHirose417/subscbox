import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, Card, FormRow, Sheet, TextField } from '@/components/ui';
import { parseDate, toDateString } from '@/domain/dates';
import { fromMinor, parseAmountInput } from '@/domain/money';
import type { Payment } from '@/domain/types';
import { useTheme } from '@/theme';
import { isAppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

import { usePaymentStore } from './store';

type Props = { payment: Payment | null; onClose: () => void };

/** 支払い履歴1件の修正（支払日・金額）と削除 */
export function EditPaymentSheet({ payment, onClose }: Props) {
  return (
    <Sheet visible={payment !== null} title="支払いを編集" onClose={onClose} closeLabel="閉じる">
      {payment ? <EditPaymentForm key={payment.id} payment={payment} onDone={onClose} /> : null}
    </Sheet>
  );
}

function EditPaymentForm({ payment, onDone }: { payment: Payment; onDone: () => void }) {
  const { spacing, accent, scheme } = useTheme();
  const edit = usePaymentStore((s) => s.edit);
  const remove = usePaymentStore((s) => s.remove);
  const [billedOn, setBilledOn] = useState(payment.billedOn);
  const [amountText, setAmountText] = useState(
    String(fromMinor(payment.amountMinor, payment.currency)),
  );
  const amountMinor = parseAmountInput(amountText, payment.currency);
  const invalid = amountMinor === null || amountMinor <= 0;

  const fail = (error: unknown) => {
    logger.error('failed to edit payment', error);
    Alert.alert(
      '保存できませんでした',
      isAppError(error) && error.code === 'VALIDATION' ? error.message : 'もう一度お試しください',
    );
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <FormRow label="支払日" separator>
          <DateTimePicker
            value={parseDate(billedOn)}
            mode="date"
            display="compact"
            locale="ja-JP"
            accentColor={accent.primary}
            themeVariant={scheme}
            maximumDate={new Date()}
            onValueChange={(_e, date) => setBilledOn(toDateString(date))}
          />
        </FormRow>
        <FormRow
          label={`金額（${payment.currency}）`}
          error={invalid ? '0より大きい金額を入力してください' : null}>
          <TextField
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="decimal-pad"
            accessibilityLabel="金額"
          />
        </FormRow>
      </Card>
      <Button
        title="保存する"
        disabled={invalid}
        onPress={async () => {
          try {
            await edit(payment.id, { billedOn, amountMinor: amountMinor! });
            onDone();
          } catch (error) {
            fail(error);
          }
        }}
      />
      <Button
        title="この支払いを削除"
        variant="destructive"
        icon="trash"
        onPress={() =>
          Alert.alert('この支払いを削除しますか？', '削除した支払いは自動では再作成されません', [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: '削除',
              style: 'destructive',
              onPress: async () => {
                try {
                  await remove(payment.id);
                  onDone();
                } catch (error) {
                  fail(error);
                }
              },
            },
          ])
        }
      />
    </View>
  );
}
