import { monthlyJpy } from './billing';
import { fromMinor } from './money';
import { formatPaymentMethod } from './paymentMethod';
import type { Category, ExchangeRates, Payment, PaymentMethod, Subscription } from './types';

/** Excel で文字化けしないよう UTF-8 の BOM を付ける */
export const CSV_BOM = '﻿';

/** 1セルを CSV 用にエスケープする（カンマ・改行・ダブルクォートを含む場合は囲む） */
export function escapeCsvCell(value: string | number | null): string {
  if (value === null) return '';
  const text = String(value);
  // 数式として解釈されるのを防ぐ（CSV インジェクション対策）
  const safe = /^[=+\-@\t\r]/.test(text) && typeof value === 'string' ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: readonly (readonly (string | number | null)[])[]): string {
  return CSV_BOM + rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n') + '\r\n';
}

const CYCLE_LABEL = { week: '週', month: 'か月', year: '年' } as const;

function cycleLabel(sub: Subscription): string {
  const { unit, interval } = sub.cycle;
  if (interval === 1) return { week: '毎週', month: '毎月', year: '毎年' }[unit];
  return `${interval}${CYCLE_LABEL[unit]}ごと`;
}

/** サブスク一覧の CSV（プレミアム）。金額は通常の単位、月額換算は円。URL・メモは機能をなくしたので出さない */
export function subscriptionsCsv(
  subs: readonly Subscription[],
  categories: readonly Category[],
  methods: readonly PaymentMethod[],
  rates: ExchangeRates,
): string {
  const header = [
    'サービス名',
    'プラン',
    '金額',
    '通貨',
    '支払い周期',
    '月額換算（円）',
    '次回更新日',
    '契約開始日',
    'カテゴリ',
    '支払い方法',
    '状態',
  ];
  const rows = subs.map((sub) => {
    const monthly = monthlyJpy(sub, rates);
    const method = methods.find((m) => m.id === sub.paymentMethodId);
    return [
      sub.name,
      sub.planName,
      fromMinor(sub.amountMinor, sub.currency),
      sub.currency,
      cycleLabel(sub),
      monthly === null ? null : Math.round(monthly),
      sub.nextRenewalDate,
      sub.startDate,
      categories.find((c) => c.id === sub.categoryId)?.name ?? null,
      method ? formatPaymentMethod(method) : null,
      sub.status === 'active' ? '契約中' : '解約済み',
    ];
  });
  return toCsv([header, ...rows]);
}

/** 支払い履歴の CSV（削除した行は含めない） */
export function paymentsCsv(payments: readonly Payment[], subs: readonly Subscription[]): string {
  const byId = new Map(subs.map((s) => [s.id, s]));
  const rows = payments
    .filter((p) => p.status === 'paid' && byId.has(p.subscriptionId))
    .sort((a, b) => a.billedOn.localeCompare(b.billedOn))
    .map((p) => [
      p.billedOn,
      byId.get(p.subscriptionId)!.name,
      fromMinor(p.amountMinor, p.currency),
      p.currency,
      p.isUserEdited ? '修正済み' : '自動記録',
    ]);
  return toCsv([['支払日', 'サービス名', '金額', '通貨', '記録'], ...rows]);
}
