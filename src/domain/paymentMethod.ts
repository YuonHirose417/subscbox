import type { PaymentMethod, PaymentMethodType } from './types';

export const paymentMethodTypeLabels: Record<PaymentMethodType, string> = {
  credit_card: 'クレジットカード',
  debit_card: 'デビットカード',
  apple_id: 'Apple ID',
  carrier: 'キャリア決済',
  other: 'その他',
};

/** 「クレジットカード（****1234）」。呼び名があれば「楽天カード（****1234）」 */
export function formatPaymentMethod(
  method: Pick<PaymentMethod, 'type' | 'label' | 'last4'>,
): string {
  const base = method.label?.trim() || paymentMethodTypeLabels[method.type];
  return method.last4 ? `${base}（****${method.last4}）` : base;
}
