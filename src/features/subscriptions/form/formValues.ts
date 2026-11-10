import type { ServicePlanPreset, ServicePreset } from '@/data/popularServices';
import { defaultNextRenewal, rollForwardRenewal } from '@/domain/billing';
import { fromMinor, parseAmountInput } from '@/domain/money';
import type {
  BillingCycle,
  CurrencyCode,
  NotificationSetting,
  Subscription,
  SubscriptionInput,
} from '@/domain/types';
import { validateSubscriptionInput, type ValidationErrors } from '@/domain/validation';

/** フォームの入力値（金額は入力中の文字列のまま持つ） */
export type FormValues = {
  serviceKey: string | null;
  name: string;
  planName: string;
  amountText: string;
  currency: CurrencyCode;
  cycle: BillingCycle;
  startDate: string;
  nextRenewalDate: string;
  /** 次回更新日を手で変えたか（変えていなければ開始日・周期から自動計算） */
  renewalEdited: boolean;
  categoryId: string;
  /** カスタム時の頭文字アイコンの色（null ならカテゴリ色） */
  iconColor: string | null;
  /** カスタムアイコン画像（プレミアム）の相対パス */
  iconImage: string | null;
  paymentMethodId: string | null;
  notification: NotificationSetting;
  lastUsedDate: string | null;
  /** プリセットの参考価格を初期値にしたか（「目安」の注記を出す） */
  usesReferencePrice: boolean;
};

export type FormField = keyof ValidationErrors;

/**
 * フォームから保存する値。URL・メモは入力欄をなくしたので含めない
 * （DB の列とバックアップの項目は残してある。編集では元の値をそのまま残す）
 */
export type FormSubmission = Omit<SubscriptionInput, 'url' | 'memo'>;

const amountToText = (amountMinor: number, currency: CurrencyCode) =>
  String(fromMinor(amountMinor, currency));

/** 契約開始日から、今日以降で最初の更新日（開始日＋1周期以降） */
export function suggestNextRenewal(startDate: string, cycle: BillingCycle, today: string): string {
  return rollForwardRenewal(
    { startDate, cycle, nextRenewalDate: defaultNextRenewal(startDate, cycle) },
    today,
  );
}

export function valuesFromPreset(
  preset: ServicePreset,
  plan: ServicePlanPreset | undefined,
  notification: NotificationSetting,
  today: string,
): FormValues {
  const cycle = plan?.cycle ?? { unit: 'month', interval: 1 };
  return {
    serviceKey: preset.key,
    name: preset.name,
    planName: plan?.name ?? '',
    amountText: plan ? amountToText(plan.amountMinor, plan.currency) : '',
    currency: plan?.currency ?? 'JPY',
    cycle,
    startDate: today,
    nextRenewalDate: suggestNextRenewal(today, cycle, today),
    renewalEdited: false,
    categoryId: preset.categoryId,
    iconColor: null,
    iconImage: null,
    paymentMethodId: null,
    notification,
    lastUsedDate: null,
    usesReferencePrice: !!plan,
  };
}

export function valuesForCustom(
  name: string,
  categoryId: string,
  notification: NotificationSetting,
  today: string,
): FormValues {
  const cycle: BillingCycle = { unit: 'month', interval: 1 };
  return {
    serviceKey: null,
    name,
    planName: '',
    amountText: '',
    currency: 'JPY',
    cycle,
    startDate: today,
    nextRenewalDate: suggestNextRenewal(today, cycle, today),
    renewalEdited: false,
    categoryId,
    iconColor: null,
    iconImage: null,
    paymentMethodId: null,
    notification,
    lastUsedDate: null,
    usesReferencePrice: false,
  };
}

export function valuesFromSubscription(sub: Subscription): FormValues {
  return {
    serviceKey: sub.serviceKey,
    name: sub.name,
    planName: sub.planName ?? '',
    amountText: amountToText(sub.amountMinor, sub.currency),
    currency: sub.currency,
    cycle: sub.cycle,
    startDate: sub.startDate,
    nextRenewalDate: sub.nextRenewalDate,
    renewalEdited: true,
    categoryId: sub.categoryId,
    iconColor: sub.serviceKey ? null : sub.icon.color,
    iconImage: sub.icon.type === 'image' ? sub.icon.value : null,
    paymentMethodId: sub.paymentMethodId,
    notification: sub.notification,
    lastUsedDate: sub.lastUsedDate,
    usesReferencePrice: false,
  };
}

/** 入力値 → 保存用の値と検証エラー */
export function toSubmission(
  values: FormValues,
  brandColor: string | null,
): { input: FormSubmission; errors: ValidationErrors } {
  const amountMinor = parseAmountInput(values.amountText, values.currency);
  const input: FormSubmission = {
    serviceKey: values.serviceKey,
    name: values.name.trim(),
    planName: values.planName.trim() || null,
    amountMinor: amountMinor ?? 0,
    currency: values.currency,
    cycle: values.cycle,
    startDate: values.startDate,
    nextRenewalDate: values.nextRenewalDate,
    categoryId: values.categoryId,
    icon: values.iconImage
      ? { type: 'image', value: values.iconImage, color: values.iconColor ?? brandColor }
      : { type: 'monogram', value: null, color: values.iconColor ?? brandColor },
    paymentMethodId: values.paymentMethodId,
    notification: values.notification,
    lastUsedDate: values.lastUsedDate,
  };
  const errors = validateSubscriptionInput(input);
  if (values.amountText.trim() === '') errors.amountMinor = '金額を入力してください';
  else if (amountMinor === null) {
    errors.amountMinor =
      values.currency === 'JPY' || values.currency === 'KRW'
        ? '金額は整数で入力してください'
        : '金額は小数点以下2桁までで入力してください';
  }
  if (values.nextRenewalDate < values.startDate) {
    errors.nextRenewalDate = '次回更新日は契約開始日以降にしてください';
  }
  return { input, errors };
}
