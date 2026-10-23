import { cycleSuffix } from '@/domain/billing';
import { formatMinor, formatMoney, fromMinor, toJpy } from '@/domain/money';
import type { ExchangeRates, Subscription } from '@/domain/types';

/** 「¥1,590/月」。外貨は「$9.99/月（約¥1,500）」 */
export function formatSubscriptionPrice(
  sub: Pick<Subscription, 'amountMinor' | 'currency' | 'cycle'>,
  rates: ExchangeRates,
): string {
  const price = `${formatMinor(sub.amountMinor, sub.currency)}${cycleSuffix(sub.cycle)}`;
  if (sub.currency === 'JPY') return price;
  const jpy = toJpy(fromMinor(sub.amountMinor, sub.currency), sub.currency, rates);
  return jpy === null ? price : `${price}（約${formatMoney(jpy)}）`;
}

/** VoiceOver 用：「月額1,590円」 */
export function spokenPrice(sub: Pick<Subscription, 'amountMinor' | 'currency' | 'cycle'>): string {
  const unit = { week: '週額', month: '月額', year: '年額' }[sub.cycle.unit];
  const prefix =
    sub.cycle.interval === 1
      ? unit
      : `${sub.cycle.interval}${{ week: '週', month: 'か月', year: '年' }[sub.cycle.unit]}ごと`;
  const amount = formatMinor(sub.amountMinor, sub.currency);
  return sub.currency === 'JPY' ? `${prefix}${amount.replace('¥', '')}円` : `${prefix}${amount}`;
}
