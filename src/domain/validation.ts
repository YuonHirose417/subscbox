import { isDateString } from './dates';
import { isCurrencyCode } from './money';
import type { SubscriptionInput } from './types';

export const LIMITS = {
  nameMax: 50,
  planNameMax: 50,
  memoMax: 500,
  /** 金額の上限（通常の単位） */
  amountMax: 9_999_999,
} as const;

export type ValidationErrors = Partial<Record<keyof SubscriptionInput, string>>;

/** http / https のみ許可 */
export function isAllowedUrl(value: string): boolean {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value);
}

/** 保存前の検証。エラーがなければ空オブジェクト */
export function validateSubscriptionInput(input: SubscriptionInput): ValidationErrors {
  const errors: ValidationErrors = {};
  const name = input.name.trim();
  if (name.length === 0) errors.name = 'サービス名を入力してください';
  else if (name.length > LIMITS.nameMax)
    errors.name = `${LIMITS.nameMax}文字以内で入力してください`;

  if (input.planName && input.planName.length > LIMITS.planNameMax) {
    errors.planName = `${LIMITS.planNameMax}文字以内で入力してください`;
  }
  if (!isCurrencyCode(input.currency)) errors.currency = '通貨を選択してください';
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    errors.amountMinor = '0より大きい金額を入力してください';
  }
  if (!Number.isInteger(input.cycle.interval) || input.cycle.interval < 1) {
    errors.cycle = '支払い周期を正しく入力してください';
  }
  if (!isDateString(input.startDate)) errors.startDate = '契約開始日を選択してください';
  if (!isDateString(input.nextRenewalDate)) errors.nextRenewalDate = '次回更新日を選択してください';
  if (input.url && !isAllowedUrl(input.url)) {
    errors.url = 'http:// または https:// で始まるURLを入力してください';
  }
  if (input.memo && input.memo.length > LIMITS.memoMax) {
    errors.memo = `${LIMITS.memoMax}文字以内で入力してください`;
  }
  return errors;
}
