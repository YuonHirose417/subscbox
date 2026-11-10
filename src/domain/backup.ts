import { isDateString } from './dates';
import { isCurrencyCode } from './money';
import { toInput } from './subscription';
import type {
  BillingCycle,
  Category,
  NotificationSetting,
  Payment,
  PaymentMethod,
  PaymentMethodType,
  PriceHistoryEntry,
  Subscription,
  SubscriptionIcon,
} from './types';
import { validateSubscriptionInput } from './validation';

export const BACKUP_FORMAT = 'subscbox-backup';
/** バックアップファイルの形式のバージョン。形式を変えたら上げ、古い版の読み込みを parseBackup で扱う */
export const BACKUP_SCHEMA_VERSION = 1;

export type BackupData = {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  subscriptions: Subscription[];
  priceHistory: PriceHistoryEntry[];
  payments: Payment[];
  /** settings テーブルの key-value（テーマ・外貨レート・通知の全体設定など） */
  settings: Record<string, unknown>;
};

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  data: BackupData;
};

export function createBackup(data: BackupData, exportedAt: Date): BackupFile {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    data,
  };
}

export type ParseResult = { ok: true; data: BackupData } | { ok: false; errors: string[] };

const MAX_ERRORS = 10;
const PAYMENT_METHOD_TYPES: readonly PaymentMethodType[] = [
  'credit_card',
  'debit_card',
  'apple_id',
  'carrier',
  'other',
];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNonEmptyStr = (v: unknown): v is string => isStr(v) && v.length > 0;
const isStrOrNull = (v: unknown): v is string | null => v === null || isStr(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isDateTime = (v: unknown): v is string => isStr(v) && !Number.isNaN(Date.parse(v));

function isCycle(v: unknown): v is BillingCycle {
  return (
    isObj(v) &&
    (v.unit === 'week' || v.unit === 'month' || v.unit === 'year') &&
    isInt(v.interval) &&
    v.interval >= 1
  );
}

function isNotification(v: unknown): v is NotificationSetting {
  return (
    isObj(v) &&
    typeof v.enabled === 'boolean' &&
    isInt(v.daysBefore) &&
    v.daysBefore >= 0 &&
    isStr(v.time)
  );
}

function isIcon(v: unknown): v is SubscriptionIcon {
  if (!isObj(v) || !isStrOrNull(v.color)) return false;
  if (v.type === 'monogram') return isStrOrNull(v.value);
  if (v.type === 'symbol') return isNonEmptyStr(v.value);
  // 画像は端末内の相対パスのみ（絶対パス・上位ディレクトリへの参照は受け付けない）
  if (v.type === 'image') return isNonEmptyStr(v.value) && !/^\/|\.\.|:/.test(v.value);
  return false;
}

function checkCategory(v: unknown): string | null {
  if (!isObj(v)) return '形式が正しくありません';
  if (!isNonEmptyStr(v.id) || !isNonEmptyStr(v.name) || !isNonEmptyStr(v.color)) {
    return 'id・名前・色が必要です';
  }
  if (!isNonEmptyStr(v.icon) || !isInt(v.sortOrder) || typeof v.isDefault !== 'boolean') {
    return 'アイコン・並び順が正しくありません';
  }
  return null;
}

function checkPaymentMethod(v: unknown): string | null {
  if (!isObj(v) || !isNonEmptyStr(v.id)) return '形式が正しくありません';
  if (!PAYMENT_METHOD_TYPES.includes(v.type as PaymentMethodType)) return '種類が正しくありません';
  if (!isStrOrNull(v.label)) return '呼び名が正しくありません';
  if (!(v.last4 === null || (isStr(v.last4) && /^\d{4}$/.test(v.last4)))) {
    return 'カード番号の下4桁が正しくありません';
  }
  if (!isInt(v.sortOrder) || !isDateTime(v.createdAt) || !isDateTime(v.updatedAt)) {
    return '並び順・日時が正しくありません';
  }
  return null;
}

function checkSubscription(v: unknown): string | null {
  if (!isObj(v) || !isNonEmptyStr(v.id)) return '形式が正しくありません';
  if (
    !isStrOrNull(v.serviceKey) ||
    !isStr(v.name) ||
    !isStrOrNull(v.planName) ||
    !isInt(v.amountMinor) ||
    !isCurrencyCode(v.currency) ||
    !isCycle(v.cycle) ||
    !isStr(v.startDate) ||
    !isStr(v.nextRenewalDate) ||
    !isNonEmptyStr(v.categoryId) ||
    !isIcon(v.icon) ||
    !isStrOrNull(v.paymentMethodId) ||
    !isStrOrNull(v.url) ||
    !isStrOrNull(v.memo) ||
    !isNotification(v.notification)
  ) {
    return '項目の型が正しくありません';
  }
  if (v.status !== 'active' && v.status !== 'cancelled') return '状態が正しくありません';
  if (!(v.cancelledAt === null || isDateTime(v.cancelledAt))) return '解約日時が正しくありません';
  if (!(v.lastUsedDate === null || isDateString(v.lastUsedDate))) {
    return '最終利用日が正しくありません';
  }
  if (!isDateTime(v.createdAt) || !isDateTime(v.updatedAt))
    return '作成・更新日時が正しくありません';
  const errors = validateSubscriptionInput(toInput(v as unknown as Subscription));
  const first = Object.values(errors)[0];
  return first ?? null;
}

function checkPriceHistory(v: unknown): string | null {
  if (!isObj(v) || !isNonEmptyStr(v.id) || !isNonEmptyStr(v.subscriptionId)) {
    return '形式が正しくありません';
  }
  if (!isInt(v.amountMinor) || v.amountMinor <= 0 || !isCurrencyCode(v.currency)) {
    return '金額が正しくありません';
  }
  if (!isCycle(v.cycle) || !isDateString(v.effectiveFrom)) return '周期・適用日が正しくありません';
  return null;
}

function checkPayment(v: unknown): string | null {
  if (!isObj(v) || !isNonEmptyStr(v.id) || !isNonEmptyStr(v.subscriptionId)) {
    return '形式が正しくありません';
  }
  if (!isDateString(v.billedOn)) return '支払日が正しくありません';
  if (!isInt(v.amountMinor) || v.amountMinor < 0 || !isCurrencyCode(v.currency)) {
    return '金額が正しくありません';
  }
  if ((v.status !== 'paid' && v.status !== 'skipped') || typeof v.isUserEdited !== 'boolean') {
    return '状態が正しくありません';
  }
  if (!isDateTime(v.createdAt) || !isDateTime(v.updatedAt))
    return '作成・更新日時が正しくありません';
  return null;
}

/**
 * バックアップファイル（JSON 文字列）を検証して取り出す。
 * 型・値・参照（カテゴリ・支払い方法・サブスクの id）を確かめ、1件でも不正なら全体を拒否する。
 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['JSONとして読み込めませんでした'] };
  }
  if (!isObj(raw) || raw.format !== BACKUP_FORMAT) {
    return { ok: false, errors: ['SubscBoxのバックアップファイルではありません'] };
  }
  if (!isInt(raw.schemaVersion) || raw.schemaVersion < 1) {
    return { ok: false, errors: ['バックアップの形式のバージョンが正しくありません'] };
  }
  if (raw.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      errors: ['新しいバージョンのアプリで作成されたバックアップです。アプリを更新してください'],
    };
  }
  const data = raw.data;
  if (!isObj(data)) return { ok: false, errors: ['データが含まれていません'] };

  const errors: string[] = [];
  const push = (message: string) => {
    if (errors.length < MAX_ERRORS) errors.push(message);
  };

  const sections = [
    ['categories', 'カテゴリ', checkCategory],
    ['paymentMethods', '支払い方法', checkPaymentMethod],
    ['subscriptions', 'サブスク', checkSubscription],
    ['priceHistory', '料金の履歴', checkPriceHistory],
    ['payments', '支払い履歴', checkPayment],
  ] as const;

  for (const [key, label, check] of sections) {
    const list = data[key];
    if (!Array.isArray(list)) {
      push(`${label}の一覧がありません`);
      continue;
    }
    const ids = new Set<string>();
    list.forEach((item, index) => {
      const problem = check(item);
      if (problem) {
        push(`${label} ${index + 1}件目：${problem}`);
        return;
      }
      const id = (item as Obj).id as string;
      if (ids.has(id)) push(`${label} ${index + 1}件目：id が重複しています`);
      ids.add(id);
    });
  }
  if (!isObj(data.settings)) push('設定がありません');
  if (errors.length > 0) return { ok: false, errors };

  const result = data as unknown as BackupData;
  const categoryIds = new Set(result.categories.map((c) => c.id));
  const methodIds = new Set(result.paymentMethods.map((m) => m.id));
  const subIds = new Set(result.subscriptions.map((s) => s.id));

  result.subscriptions.forEach((s, i) => {
    if (!categoryIds.has(s.categoryId)) push(`サブスク ${i + 1}件目：カテゴリが見つかりません`);
    if (s.paymentMethodId !== null && !methodIds.has(s.paymentMethodId)) {
      push(`サブスク ${i + 1}件目：支払い方法が見つかりません`);
    }
  });
  result.priceHistory.forEach((h, i) => {
    if (!subIds.has(h.subscriptionId)) push(`料金の履歴 ${i + 1}件目：サブスクが見つかりません`);
  });
  const paymentDays = new Set<string>();
  result.payments.forEach((p, i) => {
    if (!subIds.has(p.subscriptionId)) push(`支払い履歴 ${i + 1}件目：サブスクが見つかりません`);
    const key = `${p.subscriptionId}|${p.billedOn}`;
    if (paymentDays.has(key)) push(`支払い履歴 ${i + 1}件目：同じ日の支払いが重複しています`);
    paymentDays.add(key);
  });
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      categories: result.categories,
      paymentMethods: result.paymentMethods,
      subscriptions: result.subscriptions,
      priceHistory: result.priceHistory,
      payments: result.payments,
      settings: result.settings,
    },
  };
}

/** 件数のまとめ（復元前の確認ダイアログ用） */
export function summarizeBackup(data: BackupData): string {
  const custom = data.categories.filter((c) => !c.isDefault).length;
  return [
    `サブスク ${data.subscriptions.length}件`,
    `支払い履歴 ${data.payments.filter((p) => p.status === 'paid').length}件`,
    `支払い方法 ${data.paymentMethods.length}件`,
    `自作カテゴリ ${custom}件`,
  ].join('、');
}
