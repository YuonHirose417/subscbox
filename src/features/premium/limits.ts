import type { Subscription } from '@/domain/types';
import { AppError } from '@/utils/errors';

/** 無料版の上限値。変更はここだけで行う */
export const FREE_LIMITS = {
  /** サブスクの登録数 */
  subscriptions: 10,
  /** 自作カテゴリ数（既定6種は含めない） */
  customCategories: 3,
  /** 支払い方法の登録数 */
  paymentMethods: 2,
} as const;

/** 無料版の登録上限に達しているか（契約中のサブスクの数で数える。解約済みは履歴なので含めない） */
export function reachedSubscriptionLimit(
  items: readonly Pick<Subscription, 'status'>[],
  isPremium: boolean,
): boolean {
  if (isPremium) return false;
  return items.filter((s) => s.status === 'active').length >= FREE_LIMITS.subscriptions;
}

export const SUBSCRIPTION_LIMIT_REASON = `無料版で登録できるサブスクは${FREE_LIMITS.subscriptions}件までです。プレミアムプランなら無制限に登録できます。`;

/** プレミアムで解放される機能 */
export type PremiumFeature =
  | 'noAds'
  | 'unlimitedSubscriptions'
  | 'unlimitedCategories'
  | 'customIconImage'
  | 'perSubscriptionNotification'
  | 'paymentHistory'
  | 'csvExport'
  | 'autoSort'
  | 'accentColor'
  | 'unlimitedPaymentMethods'
  | 'paymentCalendar';

/** 無料版の上限に達したときのエラー（フェーズ7でペイウォール表示に使う） */
export class LimitReachedError extends AppError {
  constructor(message: string) {
    super('VALIDATION', message);
    this.name = 'LimitReachedError';
  }
}
