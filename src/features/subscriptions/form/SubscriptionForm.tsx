import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { MenuView } from '@expo/ui/community/menu';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  FormRow,
  Icon,
  IconButton,
  SegmentedControl,
  TextField,
  Toggle,
} from '@/components/ui';
import { popularServicesByKey, type ServicePlanPreset } from '@/data/popularServices';
import { parseDate, toDateString } from '@/domain/dates';
import { currencies, currencyCodes, fromMinor } from '@/domain/money';
import { effectiveNotification } from '@/domain/notifications';
import { formatPaymentMethod } from '@/domain/paymentMethod';
import type { CycleUnit, SubscriptionInput } from '@/domain/types';
import { LIMITS } from '@/domain/validation';
import { useCategories } from '@/features/categories/store';
import { ensureNotificationPermission } from '@/features/notifications/permission';
import { usePaymentMethodStore } from '@/features/paymentMethods/store';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';
import { useTheme } from '@/theme';
import { isAppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { openPaywall } from '@/features/premium/gate';

import {
  dateToTime,
  NOTIFY_DAY_OPTIONS,
  notifyDaysLabel,
  timeToDate,
} from '../components/NotificationSettingSheet';
import { ServiceIcon } from '../components/ServiceIcon';
import { pickIconImage } from '../iconImages';
import { CategoryPickerSheet } from './CategoryPickerSheet';
import { ColorChoices } from './ColorChoices';
import { suggestNextRenewal, toSubmission, type FormField, type FormValues } from './formValues';
import { PaymentMethodPickerSheet } from './PaymentMethodPickerSheet';

type Props = {
  initialValues: FormValues;
  submitLabel: string;
  today: string;
  onSubmit: (input: SubscriptionInput) => Promise<void>;
};

const CYCLE_OPTIONS = [
  { value: 'week', label: '週' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
] as const;
const CYCLE_UNIT_LABEL: Record<CycleUnit, string> = { week: '週', month: 'か月', year: '年' };
/** サブスクの入力フォーム（追加・編集で共通） */
export function SubscriptionForm({ initialValues, submitLabel, today, onSubmit }: Props) {
  const { spacing, colors, accent, scheme, typography } = useTheme();
  const categories = useCategories();
  const paymentMethods = usePaymentMethodStore((s) => s.items);
  const notificationDefaults = useSettingsStore((s) => s.notificationDefaults);
  const { isPremium } = usePremium();

  const [values, setValues] = useState<FormValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState<'category' | 'payment' | null>(null);

  const preset = values.serviceKey ? popularServicesByKey[values.serviceKey] : undefined;
  const isCustom = !preset;
  const category = categories.find((c) => c.id === values.categoryId);
  const paymentMethod = paymentMethods.find((m) => m.id === values.paymentMethodId);
  const { input, errors } = useMemo(
    () => toSubmission(values, preset?.brandColor ?? null),
    [values, preset],
  );
  const isValid = Object.keys(errors).length === 0;
  const errorOf = (field: FormField) => (touched[field] ? (errors[field] ?? null) : null);
  const touch = (field: FormField) => setTouched((t) => ({ ...t, [field]: true }));

  const update = (patch: Partial<FormValues>) =>
    setValues((v) => {
      const next = { ...v, ...patch };
      // 次回更新日を手で変えていなければ、開始日・周期から自動で計算し直す
      if (!next.renewalEdited && (patch.startDate || patch.cycle)) {
        next.nextRenewalDate = suggestNextRenewal(next.startDate, next.cycle, today);
      }
      return next;
    });

  const applyPlan = (plan: ServicePlanPreset) => {
    Haptics.selectionAsync().catch(() => {});
    update({
      planName: plan.name,
      amountText: String(fromMinor(plan.amountMinor, plan.currency)),
      currency: plan.currency,
      cycle: plan.cycle,
      usesReferencePrice: true,
    });
  };

  const submit = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      // 無料版は通知の個別設定を変更させない（新規は全体設定の値、編集は元の値のまま）
      const saved = isPremium ? input : { ...input, notification: initialValues.notification };
      await onSubmit(saved);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // 通知が有効な状態で初めて保存したときに、通知の許可を尋ねる
      if (effectiveNotification(saved, notificationDefaults, isPremium).enabled) {
        void ensureNotificationPermission();
      }
    } catch (error) {
      logger.error('failed to save subscription', error);
      Alert.alert(
        '保存できませんでした',
        isAppError(error) && error.code === 'VALIDATION' ? error.message : 'もう一度お試しください',
      );
      setSaving(false);
    }
  };

  const requirePremium = () =>
    openPaywall(
      `無料版では、すべてのサブスクに通知の全体設定（${notifyDaysLabel(notificationDefaults.daysBefore)} ${notificationDefaults.time}）が適用されます。サブスクごとの設定はプレミアムプランで利用できます。`,
    );

  const pickImage = async () => {
    try {
      const path = await pickIconImage();
      if (path) update({ iconImage: path });
    } catch (error) {
      logger.error('failed to pick icon image', error);
      Alert.alert('画像を読み込めませんでした', 'もう一度お試しください');
    }
  };

  const chooseIconImage = () => {
    if (!isPremium) {
      openPaywall('アイコンに好きな写真を設定できるのは、プレミアムプランの機能です。');
      return;
    }
    if (!values.iconImage) {
      void pickImage();
      return;
    }
    Alert.alert('アイコンの画像', undefined, [
      { text: '別の写真を選ぶ', onPress: () => void pickImage() },
      { text: '画像を外す', style: 'destructive', onPress: () => update({ iconImage: null }) },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const cardStyle = { paddingHorizontal: spacing.md };

  return (
    <View style={{ gap: spacing.md }}>
      {/* サービス */}
      <Card padding={0} style={cardStyle}>
        <View style={[styles.serviceRow, { gap: spacing.sm, paddingVertical: spacing.sm }]}>
          <ServiceIcon
            subscription={{
              serviceKey: values.serviceKey,
              name: values.name || '?',
              categoryId: values.categoryId,
              icon: values.iconImage
                ? { type: 'image', value: values.iconImage, color: values.iconColor }
                : { type: 'monogram', value: null, color: values.iconColor },
            }}
          />
          <View style={styles.flex}>
            <AppText variant="caption" tone="secondary">
              サービス名
            </AppText>
            <TextField
              align="left"
              value={values.name}
              onChangeText={(name) => update({ name })}
              onBlur={() => touch('name')}
              placeholder="例：Netflix"
              maxLength={LIMITS.nameMax}
              accessibilityLabel="サービス名"
              style={typography.headline}
            />
          </View>
        </View>
        {errorOf('name') ? (
          <AppText
            variant="caption"
            style={{ color: colors.negativeText, paddingBottom: spacing.xs }}>
            {errorOf('name')}
          </AppText>
        ) : null}
        <View style={[styles.hairline, { backgroundColor: colors.hairline }]} />
        <FormRow
          label="アイコンの画像"
          separator
          showChevron
          onPress={chooseIconImage}
          accessibilityLabel={`アイコンの画像、${values.iconImage ? '設定済み' : '未設定'}${isPremium ? '' : '、プレミアム'}`}>
          <View style={[styles.inlineRow, { gap: spacing.xs }]}>
            <AppText variant="body" tone="secondary">
              {values.iconImage ? '設定済み' : '写真を選ぶ'}
            </AppText>
            {isPremium ? null : (
              <Icon name="lock.fill" fallback="lock-closed" size={12} color={colors.textTertiary} />
            )}
          </View>
        </FormRow>
        {isCustom && !values.iconImage ? (
          <FormRow label="アイコンの色" stacked separator>
            <ColorChoices
              value={values.iconColor ?? category?.color ?? null}
              onChange={(iconColor) => update({ iconColor })}
            />
          </FormRow>
        ) : null}
        <FormRow
          label="プラン名"
          stacked={!!preset && preset.plans.length > 0}
          error={errorOf('planName')}>
          {preset && preset.plans.length > 0 ? (
            <View style={{ gap: spacing.xs }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.xs }}>
                {preset.plans.map((plan) => (
                  <Chip
                    key={plan.name}
                    label={plan.name}
                    selected={values.planName === plan.name}
                    onPress={() => applyPlan(plan)}
                  />
                ))}
              </ScrollView>
              <TextField
                align="left"
                value={values.planName}
                onChangeText={(planName) => update({ planName })}
                onBlur={() => touch('planName')}
                placeholder="プラン名を入力（任意）"
                maxLength={LIMITS.planNameMax}
                accessibilityLabel="プラン名"
              />
            </View>
          ) : (
            <TextField
              value={values.planName}
              onChangeText={(planName) => update({ planName })}
              onBlur={() => touch('planName')}
              placeholder="任意"
              maxLength={LIMITS.planNameMax}
              accessibilityLabel="プラン名"
            />
          )}
        </FormRow>
      </Card>

      {/* 料金 */}
      <Card padding={0} style={cardStyle}>
        <FormRow
          label="金額"
          separator
          error={errorOf('amountMinor')}
          hint={
            values.usesReferencePrice
              ? '参考価格（目安）です。実際の金額をご確認のうえ修正してください'
              : undefined
          }>
          <View style={[styles.amountRow, { gap: spacing.xs }]}>
            <TextField
              value={values.amountText}
              onChangeText={(amountText) => update({ amountText, usesReferencePrice: false })}
              onBlur={() => touch('amountMinor')}
              placeholder="0"
              keyboardType={
                currencies[values.currency].fractionDigits > 0 ? 'decimal-pad' : 'number-pad'
              }
              accessibilityLabel="金額"
              style={[styles.flex, styles.amountInput]}
            />
            <MenuView
              title="通貨"
              actions={currencyCodes.map((code) => ({
                id: code,
                title: `${code}（${currencies[code].label}）`,
                state: code === values.currency ? 'on' : 'off',
              }))}
              onPressAction={({ nativeEvent }) =>
                update({ currency: nativeEvent.event as FormValues['currency'] })
              }>
              <View
                accessible
                accessibilityRole="button"
                accessibilityLabel={`通貨：${values.currency}`}
                style={[
                  styles.currency,
                  { backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.sm },
                ]}>
                <AppText variant="callout">{values.currency}</AppText>
                <Icon
                  name="chevron.up.chevron.down"
                  fallback="chevron-down"
                  size={11}
                  color={colors.textSecondary}
                />
              </View>
            </MenuView>
          </View>
        </FormRow>
        <FormRow label="支払い周期" stacked separator error={errorOf('cycle')}>
          <SegmentedControl
            options={CYCLE_OPTIONS}
            value={values.cycle.unit}
            onChange={(unit) =>
              update({ cycle: { ...values.cycle, unit }, usesReferencePrice: false })
            }
          />
        </FormRow>
        <FormRow label="間隔">
          <View style={[styles.stepper, { gap: spacing.sm }]}>
            <IconButton
              icon="minus"
              fallback="remove"
              size={32}
              accessibilityLabel="間隔を短くする"
              onPress={() =>
                values.cycle.interval > 1 &&
                update({ cycle: { ...values.cycle, interval: values.cycle.interval - 1 } })
              }
            />
            <AppText variant="callout" style={styles.interval}>
              {values.cycle.interval}
              {CYCLE_UNIT_LABEL[values.cycle.unit]}ごと
            </AppText>
            <IconButton
              icon="plus"
              fallback="add"
              size={32}
              accessibilityLabel="間隔を長くする"
              onPress={() =>
                values.cycle.interval < 99 &&
                update({ cycle: { ...values.cycle, interval: values.cycle.interval + 1 } })
              }
            />
          </View>
        </FormRow>
      </Card>

      {/* 日付 */}
      <Card padding={0} style={cardStyle}>
        <FormRow label="契約開始日" separator error={errorOf('startDate')}>
          <DateTimePicker
            value={parseDate(values.startDate)}
            mode="date"
            display="compact"
            locale="ja-JP"
            accentColor={accent.primary}
            themeVariant={scheme}
            onValueChange={(_e, date) => {
              touch('startDate');
              update({ startDate: toDateString(date) });
            }}
          />
        </FormRow>
        <FormRow
          label="次回更新日"
          error={
            touched.nextRenewalDate || touched.startDate ? (errors.nextRenewalDate ?? null) : null
          }
          hint={
            values.renewalEdited ? undefined : '契約開始日と支払い周期から自動で計算しています'
          }>
          <DateTimePicker
            value={parseDate(values.nextRenewalDate)}
            mode="date"
            display="compact"
            locale="ja-JP"
            accentColor={accent.primary}
            themeVariant={scheme}
            minimumDate={parseDate(values.startDate)}
            onValueChange={(_e, date) => {
              touch('nextRenewalDate');
              update({ nextRenewalDate: toDateString(date), renewalEdited: true });
            }}
          />
        </FormRow>
      </Card>

      {/* 分類・支払い */}
      <Card padding={0} style={cardStyle}>
        <FormRow label="カテゴリ" separator onPress={() => setSheet('category')}>
          <AppText variant="body" numberOfLines={1}>
            {category?.name ?? '未選択'}
          </AppText>
        </FormRow>
        <FormRow label="支払い方法" onPress={() => setSheet('payment')}>
          <AppText variant="body" tone={paymentMethod ? 'primary' : 'tertiary'} numberOfLines={1}>
            {paymentMethod ? formatPaymentMethod(paymentMethod) : '未設定'}
          </AppText>
        </FormRow>
      </Card>

      {/* 通知 */}
      <Card padding={0} style={cardStyle}>
        {isPremium ? (
          <>
            <FormRow label="更新前に通知する" separator={values.notification.enabled}>
              <Toggle
                value={values.notification.enabled}
                accessibilityLabel="更新前に通知する"
                onValueChange={(enabled) =>
                  update({ notification: { ...values.notification, enabled } })
                }
              />
            </FormRow>
            {values.notification.enabled ? (
              <>
                <FormRow label="タイミング" stacked separator>
                  <View style={[styles.wrap, { gap: spacing.xs }]}>
                    {NOTIFY_DAY_OPTIONS.map((d) => (
                      <Chip
                        key={d.days}
                        label={d.label}
                        selected={values.notification.daysBefore === d.days}
                        onPress={() =>
                          update({ notification: { ...values.notification, daysBefore: d.days } })
                        }
                      />
                    ))}
                  </View>
                </FormRow>
                <FormRow label="時刻" error={errorOf('notification')}>
                  <DateTimePicker
                    value={timeToDate(values.notification.time)}
                    mode="time"
                    display="compact"
                    locale="ja-JP"
                    accentColor={accent.primary}
                    themeVariant={scheme}
                    onValueChange={(_e, date) =>
                      update({
                        notification: {
                          ...values.notification,
                          time: dateToTime(date),
                        },
                      })
                    }
                  />
                </FormRow>
              </>
            ) : null}
          </>
        ) : (
          <FormRow
            label="更新前の通知"
            onPress={requirePremium}
            showChevron={false}
            accessibilityLabel="更新前の通知、全体設定に従う。サブスクごとの設定はプレミアムプランの機能です">
            <View style={[styles.locked, { gap: spacing.xxs }]}>
              <AppText variant="footnote" tone="secondary" numberOfLines={1}>
                {notificationDefaults.enabled
                  ? `全体設定に従う（${notifyDaysLabel(notificationDefaults.daysBefore)} ${notificationDefaults.time}）`
                  : '全体設定に従う（オフ）'}
              </AppText>
              <Icon name="lock.fill" fallback="lock-closed" size={12} color={colors.textTertiary} />
            </View>
          </FormRow>
        )}
      </Card>

      {/* その他 */}
      <Card padding={0} style={cardStyle}>
        <FormRow label="URL" separator error={errorOf('url')}>
          <TextField
            value={values.url}
            onChangeText={(url) => update({ url })}
            onBlur={() => touch('url')}
            placeholder="https://（任意）"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="URL"
          />
        </FormRow>
        <FormRow label="メモ" stacked error={errorOf('memo')}>
          <TextField
            align="left"
            multiline
            value={values.memo}
            onChangeText={(memo) => update({ memo })}
            onBlur={() => touch('memo')}
            placeholder="任意（500文字まで）"
            maxLength={LIMITS.memoMax}
            accessibilityLabel="メモ"
          />
        </FormRow>
      </Card>

      <View style={{ gap: spacing.xs }}>
        <Button title={submitLabel} onPress={submit} disabled={!isValid} loading={saving} />
        {!isValid ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setTouched({
                name: true,
                amountMinor: true,
                cycle: true,
                startDate: true,
                nextRenewalDate: true,
                url: true,
                memo: true,
                planName: true,
                notification: true,
              })
            }>
            <AppText variant="caption" tone="tertiary" style={styles.center}>
              未入力・誤りのある項目があります（タップで表示）
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <CategoryPickerSheet
        visible={sheet === 'category'}
        value={values.categoryId}
        onSelect={(categoryId) => update({ categoryId })}
        onClose={() => setSheet(null)}
      />
      <PaymentMethodPickerSheet
        visible={sheet === 'payment'}
        value={values.paymentMethodId}
        onSelect={(paymentMethodId) => update({ paymentMethodId })}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  serviceRow: { flexDirection: 'row', alignItems: 'center' },
  hairline: { height: StyleSheet.hairlineWidth },
  amountRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  amountInput: { fontVariant: ['tabular-nums'] },
  currency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    borderRadius: 999,
  },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  interval: { minWidth: 72, textAlign: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  locked: { flexDirection: 'row', alignItems: 'center' },
  center: { textAlign: 'center' },
});
