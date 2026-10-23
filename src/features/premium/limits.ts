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
