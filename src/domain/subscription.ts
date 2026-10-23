import type { Subscription, SubscriptionInput } from './types';

/** 保存済みのサブスクから入力値（編集・複製の元）を取り出す */
export function toInput(sub: Subscription): SubscriptionInput {
  return {
    serviceKey: sub.serviceKey,
    name: sub.name,
    planName: sub.planName,
    amountMinor: sub.amountMinor,
    currency: sub.currency,
    cycle: sub.cycle,
    startDate: sub.startDate,
    nextRenewalDate: sub.nextRenewalDate,
    categoryId: sub.categoryId,
    icon: sub.icon,
    paymentMethodId: sub.paymentMethodId,
    url: sub.url,
    memo: sub.memo,
    notification: sub.notification,
    lastUsedDate: sub.lastUsedDate,
  };
}
