/** 端末ローカルの日付 'YYYY-MM-DD' */
export type DateString = string;
/** ISO 8601（UTC）の日時文字列 */
export type DateTimeString = string;

export type CurrencyCode = 'JPY' | 'USD' | 'EUR' | 'GBP' | 'CNY' | 'KRW' | 'TWD' | 'AUD' | 'CAD';

export type CycleUnit = 'week' | 'month' | 'year';

export type BillingCycle = {
  unit: CycleUnit;
  /** N週・Nか月・N年ごと（1以上） */
  interval: number;
};

export type SubscriptionStatus = 'active' | 'cancelled';

export type DefaultCategoryId = 'video_music' | 'productivity' | 'cloud' | 'game' | 'sns' | 'other';

export type Category = {
  id: string;
  name: string;
  color: string;
  /** SF Symbol 名 */
  icon: string;
  sortOrder: number;
  isDefault: boolean;
};

export type SubscriptionIcon =
  | { type: 'monogram'; value: string | null; color: string | null }
  | { type: 'symbol'; value: string; color: string | null }
  /** カスタム画像（プレミアム）。value はアプリの文書ディレクトリからの相対パス */
  | { type: 'image'; value: string; color: string | null };

export type NotificationSetting = {
  enabled: boolean;
  /** 0=当日 */
  daysBefore: number;
  /** 'HH:mm' */
  time: string;
};

export type Subscription = {
  id: string;
  /** 人気サービスのプリセットID（カスタムは null） */
  serviceKey: string | null;
  name: string;
  planName: string | null;
  /** 通貨の最小単位（JPY=円、USD=セント） */
  amountMinor: number;
  currency: CurrencyCode;
  cycle: BillingCycle;
  /** 契約開始日（周期の基準日） */
  startDate: DateString;
  nextRenewalDate: DateString;
  categoryId: string;
  icon: SubscriptionIcon;
  /** 支払い方法（payment_methods テーブル、フェーズ3） */
  paymentMethodId: string | null;
  url: string | null;
  memo: string | null;
  notification: NotificationSetting;
  status: SubscriptionStatus;
  cancelledAt: DateTimeString | null;
  /** ユーザーが任意で記録する最終利用日（見直し候補用） */
  lastUsedDate: DateString | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
};

export type SubscriptionInput = Omit<
  Subscription,
  'id' | 'status' | 'cancelledAt' | 'createdAt' | 'updatedAt'
>;

/** 料金・周期の変更履歴（前月比・月別推移の算出に使用） */
export type PriceHistoryEntry = {
  id: string;
  subscriptionId: string;
  amountMinor: number;
  currency: CurrencyCode;
  cycle: BillingCycle;
  /** この料金が有効になった日 */
  effectiveFrom: DateString;
};

/** 1 外貨 = rate 円（ユーザー入力） */
export type ExchangeRates = Partial<Record<CurrencyCode, number>>;

export type Period = 'month' | 'year' | 'all';

export type SortOrder = 'created' | 'renewal' | 'amountDesc' | 'amountAsc' | 'name';

export type PaymentMethodType = 'credit_card' | 'debit_card' | 'apple_id' | 'carrier' | 'other';

/** 支払い方法（payment_methods テーブル）。カード番号は下4桁のみ保持する */
export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  /** 任意の呼び名（例：「楽天カード」） */
  label: string | null;
  last4: string | null;
  sortOrder: number;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
};

export type PaymentMethodInput = Pick<PaymentMethod, 'type' | 'label' | 'last4'>;

export type CategoryInput = Pick<Category, 'name' | 'color' | 'icon'>;

/**
 * 支払い履歴（payments テーブル・プレミアム）。請求予定日から自動生成し、
 * ユーザーが個別に修正・削除できる。削除は status='skipped' で残し、再生成で復活させない。
 */
export type Payment = {
  id: string;
  subscriptionId: string;
  billedOn: DateString;
  amountMinor: number;
  currency: CurrencyCode;
  status: 'paid' | 'skipped';
  isUserEdited: boolean;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
};
