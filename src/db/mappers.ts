import type {
  Category,
  CurrencyCode,
  CycleUnit,
  Payment,
  PaymentMethod,
  PaymentMethodType,
  PriceHistoryEntry,
  Subscription,
  SubscriptionIcon,
  SubscriptionInput,
} from '@/domain/types';
import { categoryColors, type CategoryColorKey } from '@/theme/tokens';

import type { SqlValue } from './adapter';

export type SubscriptionRow = {
  id: string;
  service_key: string | null;
  name: string;
  plan_name: string | null;
  amount_minor: number;
  currency: string;
  cycle_unit: string;
  cycle_interval: number;
  start_date: string;
  next_renewal_date: string;
  category_id: string;
  icon_type: string;
  icon_value: string | null;
  icon_color: string | null;
  payment_method_id: string | null;
  url: string | null;
  memo: string | null;
  notify_enabled: number;
  notify_days_before: number;
  notify_time: string;
  status: string;
  cancelled_at: string | null;
  last_used_date: string | null;
  created_at: string;
  updated_at: string;
};

function toIcon(row: SubscriptionRow): SubscriptionIcon {
  if (row.icon_type === 'symbol' && row.icon_value) {
    return { type: 'symbol', value: row.icon_value, color: row.icon_color };
  }
  if (row.icon_type === 'image' && row.icon_value) {
    return { type: 'image', value: row.icon_value, color: row.icon_color };
  }
  return { type: 'monogram', value: row.icon_value, color: row.icon_color };
}

export function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    serviceKey: row.service_key,
    name: row.name,
    planName: row.plan_name,
    amountMinor: row.amount_minor,
    currency: row.currency as CurrencyCode,
    cycle: { unit: row.cycle_unit as CycleUnit, interval: row.cycle_interval },
    startDate: row.start_date,
    nextRenewalDate: row.next_renewal_date,
    categoryId: row.category_id,
    icon: toIcon(row),
    paymentMethodId: row.payment_method_id,
    url: row.url,
    memo: row.memo,
    notification: {
      enabled: row.notify_enabled === 1,
      daysBefore: row.notify_days_before,
      time: row.notify_time,
    },
    status: row.status === 'cancelled' ? 'cancelled' : 'active',
    cancelledAt: row.cancelled_at,
    lastUsedDate: row.last_used_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** INSERT / UPDATE 用の列と値（id・status・タイムスタンプ以外） */
export function inputToColumns(input: SubscriptionInput): Record<string, SqlValue> {
  return {
    service_key: input.serviceKey,
    name: input.name.trim(),
    plan_name: input.planName?.trim() || null,
    amount_minor: input.amountMinor,
    currency: input.currency,
    cycle_unit: input.cycle.unit,
    cycle_interval: input.cycle.interval,
    start_date: input.startDate,
    next_renewal_date: input.nextRenewalDate,
    category_id: input.categoryId,
    icon_type: input.icon.type,
    icon_value: input.icon.value,
    icon_color: input.icon.color,
    payment_method_id: input.paymentMethodId,
    url: input.url?.trim() || null,
    memo: input.memo?.trim() || null,
    notify_enabled: input.notification.enabled ? 1 : 0,
    notify_days_before: input.notification.daysBefore,
    notify_time: input.notification.time,
    last_used_date: input.lastUsedDate,
  };
}

export type PriceHistoryRow = {
  id: string;
  subscription_id: string;
  amount_minor: number;
  currency: string;
  cycle_unit: string;
  cycle_interval: number;
  effective_from: string;
};

export function rowToPriceHistory(row: PriceHistoryRow): PriceHistoryEntry {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    amountMinor: row.amount_minor,
    currency: row.currency as CurrencyCode,
    cycle: { unit: row.cycle_unit as CycleUnit, interval: row.cycle_interval },
    effectiveFrom: row.effective_from,
  };
}

export type CategoryRow = {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  is_default: number;
};

export function rowToCategory(row: CategoryRow): Category {
  const isDefault = row.is_default === 1;
  return {
    id: row.id,
    name: row.name,
    // 既定カテゴリの色はユーザーが変更できないので、保存値ではなく現在のテーマのカテゴリカラーで表示する
    // （配色の変更を既存ユーザーにも反映するため。DB の値は書き換えない）
    color: isDefault ? (categoryColors[row.id as CategoryColorKey] ?? row.color) : row.color,
    icon: row.icon,
    sortOrder: row.sort_order,
    isDefault,
  };
}

export type PaymentMethodRow = {
  id: string;
  type: string;
  label: string | null;
  last4: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function rowToPaymentMethod(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    type: row.type as PaymentMethodType,
    label: row.label,
    last4: row.last4,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type PaymentRow = {
  id: string;
  subscription_id: string;
  billed_on: string;
  amount_minor: number;
  currency: string;
  status: string;
  is_user_edited: number;
  created_at: string;
  updated_at: string;
};

export function rowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    billedOn: row.billed_on,
    amountMinor: row.amount_minor,
    currency: row.currency as CurrencyCode,
    status: row.status === 'skipped' ? 'skipped' : 'paid',
    isUserEdited: row.is_user_edited === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
