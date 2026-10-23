import type { CurrencyCode, ExchangeRates } from './types';

type CurrencyInfo = { symbol: string; fractionDigits: number; label: string };

export const currencies: Record<CurrencyCode, CurrencyInfo> = {
  JPY: { symbol: '¥', fractionDigits: 0, label: '日本円' },
  USD: { symbol: '$', fractionDigits: 2, label: '米ドル' },
  EUR: { symbol: '€', fractionDigits: 2, label: 'ユーロ' },
  GBP: { symbol: '£', fractionDigits: 2, label: '英ポンド' },
  CNY: { symbol: 'CN¥', fractionDigits: 2, label: '人民元' },
  KRW: { symbol: '₩', fractionDigits: 0, label: '韓国ウォン' },
  TWD: { symbol: 'NT$', fractionDigits: 2, label: '台湾ドル' },
  AUD: { symbol: 'A$', fractionDigits: 2, label: '豪ドル' },
  CAD: { symbol: 'C$', fractionDigits: 2, label: 'カナダドル' },
};

export const currencyCodes = Object.keys(currencies) as CurrencyCode[];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && value in currencies;
}

/** 最小単位 → 通常の単位（USD 999 → 9.99） */
export function fromMinor(amountMinor: number, currency: CurrencyCode): number {
  return amountMinor / 10 ** currencies[currency].fractionDigits;
}

/** 通常の単位 → 最小単位（四捨五入して整数にする） */
export function toMinor(amount: number, currency: CurrencyCode): number {
  return Math.round(amount * 10 ** currencies[currency].fractionDigits);
}

/**
 * 入力文字列 → 最小単位。桁区切りのカンマ・全角数字を許容し、
 * 小数桁がその通貨の桁数を超える、数値でない場合は null。
 */
export function parseAmountInput(text: string, currency: CurrencyCode): number | null {
  const normalized = text
    .normalize('NFKC')
    .replace(/[,\s]/g, '')
    .replace(/^[¥$€£₩]/, '');
  const digits = currencies[currency].fractionDigits;
  const re = digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(\\.\\d{1,${digits}})?$`);
  if (!re.test(normalized)) return null;
  return toMinor(Number(normalized), currency);
}

function groupDigits(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 金額を表示用に整形する。value は通常の単位（円・ドル）。
 * JPY は端数を四捨五入（内部は小数のまま集計し、表示時だけ丸める）。
 */
export function formatMoney(
  value: number,
  currency: CurrencyCode = 'JPY',
  options: { signed?: boolean } = {},
): string {
  const { symbol, fractionDigits } = currencies[currency];
  const rounded = Number(Math.abs(value).toFixed(fractionDigits));
  const isZero = rounded === 0;
  const [int, frac] = rounded.toFixed(fractionDigits).split('.');
  const body = `${symbol}${groupDigits(int)}${frac ? `.${frac}` : ''}`;
  if (value < 0 && !isZero) return `-${body}`;
  if (options.signed && !isZero) return `+${body}`;
  return body;
}

export function formatMinor(amountMinor: number, currency: CurrencyCode): string {
  return formatMoney(fromMinor(amountMinor, currency), currency);
}

/** 円換算（円の通常単位、小数あり）。レート未設定なら null */
export function toJpy(amount: number, currency: CurrencyCode, rates: ExchangeRates): number | null {
  if (currency === 'JPY') return amount;
  const rate = rates[currency];
  if (rate === undefined || !(rate > 0)) return null;
  return amount * rate;
}
