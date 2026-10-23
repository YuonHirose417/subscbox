import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { AppText, Card, FormRow, Screen, ScreenHeader, TextField } from '@/components/ui';
import { currencies, currencyCodes } from '@/domain/money';
import type { CurrencyCode, ExchangeRates } from '@/domain/types';
import { useSettingsStore } from '@/features/settings/store';
import { useSubscriptionStore } from '@/features/subscriptions/store';
import { useTheme } from '@/theme';

const FOREIGN = currencyCodes.filter((c) => c !== 'JPY');
const MAX_RATE = 100_000;

function parseRate(text: string): number | null | 'invalid' {
  const normalized = text.normalize('NFKC').replace(/[,\s]/g, '');
  if (normalized === '') return null;
  if (!/^\d+(\.\d{1,4})?$/.test(normalized)) return 'invalid';
  const value = Number(normalized);
  return value > 0 && value < MAX_RATE ? value : 'invalid';
}

/** 外貨の円換算レート（ユーザー入力。為替APIは使わない） */
export default function CurrencyScreen() {
  const { spacing } = useTheme();
  const rates = useSettingsStore((s) => s.exchangeRates);
  const setRates = useSettingsStore((s) => s.setExchangeRates);
  const used = new Set(useSubscriptionStore((s) => s.items).map((s) => s.currency));
  const [texts, setTexts] = useState<Partial<Record<CurrencyCode, string>>>(() =>
    Object.fromEntries(FOREIGN.map((c) => [c, rates[c] !== undefined ? String(rates[c]) : ''])),
  );
  const [errors, setErrors] = useState<Partial<Record<CurrencyCode, boolean>>>({});

  // 使っている通貨を先に並べる
  const ordered = [...FOREIGN].sort((a, b) => Number(used.has(b)) - Number(used.has(a)));

  const commit = (code: CurrencyCode) => {
    const parsed = parseRate(texts[code] ?? '');
    if (parsed === 'invalid') {
      setErrors((e) => ({ ...e, [code]: true }));
      return;
    }
    setErrors((e) => ({ ...e, [code]: false }));
    const next: ExchangeRates = { ...rates };
    if (parsed === null) delete next[code];
    else next[code] = parsed;
    setRates(next);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        contentStyle={{ gap: spacing.md }}
        scrollProps={{ keyboardShouldPersistTaps: 'handled', keyboardDismissMode: 'on-drag' }}>
        <ScreenHeader showBack title="外貨の為替レート" />
        <AppText variant="footnote" tone="secondary">
          外貨のサブスクは、ここで入力したレートで円に換算して合計します。為替レートは自動では取得しません（外部と通信しません）。未入力の通貨は合計から除外されます。
        </AppText>
        <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
          {ordered.map((code, index) => (
            <FormRow
              key={code}
              label={`1 ${code}（${currencies[code].label}）`}
              separator={index < ordered.length - 1}
              error={errors[code] ? '0より大きい数値（小数4桁まで）を入力してください' : null}
              hint={
                used.has(code) && !rates[code] ? '登録中のサブスクで使われています' : undefined
              }>
              <View style={[styles.row, { gap: spacing.xs }]}>
                <TextField
                  value={texts[code] ?? ''}
                  onChangeText={(t) => setTexts((s) => ({ ...s, [code]: t }))}
                  onBlur={() => commit(code)}
                  onSubmitEditing={() => commit(code)}
                  placeholder="未設定"
                  keyboardType="decimal-pad"
                  accessibilityLabel={`1 ${code} あたりの円`}
                  style={styles.input}
                />
                <AppText variant="body">円</AppText>
              </View>
            </FormRow>
          ))}
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  input: { flex: 1, fontVariant: ['tabular-nums'] },
});
