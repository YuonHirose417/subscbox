import {
  addCycles,
  addDays,
  addMonthsTo,
  startOfMonth,
  today as todayString,
} from '@/domain/dates';
import type { PriceHistoryEntry, Subscription } from '@/domain/types';

import { popularServicesByKey } from './popularServices';

type SampleSpec = {
  key: string;
  planName: string;
  amountMinor: number;
  categoryId: string;
  /** 今日から次回更新日までの日数（カンプのバッジ「あと3日」等） */
  daysLeft?: number;
  /** 指定時はこの日を契約開始日にする（それ以外は次回更新日の6か月前） */
  startDate?: string;
  lastUsedDaysAgo?: number;
  cancelledMonthsAgo?: number;
  name?: string;
  memo?: string;
};

const monthly = { unit: 'month', interval: 1 } as const;

/**
 * 開発用サンプルデータ。カンプの一覧画面と同じ7件（並び・金額・プラン・残り日数）＋
 * 見直し候補画面に出てくる U-NEXT と、表示確認用の解約済み1件。
 * 日付は「今日」を基準に生成するので、いつ起動してもバッジがカンプと同じ日数になる。
 */
export function buildSampleData(now: Date = new Date()): {
  subscriptions: Subscription[];
  priceHistory: PriceHistoryEntry[];
} {
  const today = todayString(now);
  const thisMonth = startOfMonth(today);

  const specs: SampleSpec[] = [
    {
      key: 'netflix',
      planName: 'スタンダードプラン',
      amountMinor: 1590,
      categoryId: 'video_music',
      daysLeft: 3,
    },
    {
      key: 'youtube',
      planName: '個人プラン',
      amountMinor: 1280,
      categoryId: 'video_music',
      daysLeft: 5,
    },
    {
      key: 'spotify',
      planName: 'Premiumプラン',
      amountMinor: 980,
      categoryId: 'video_music',
      daysLeft: 14,
      lastUsedDaysAgo: 100,
    },
    { key: 'icloud', planName: '50GBプラン', amountMinor: 150, categoryId: 'cloud', daysLeft: 19 },
    {
      key: 'google_one',
      planName: 'ベーシック（100GB）',
      amountMinor: 250,
      categoryId: 'cloud',
      daysLeft: 18,
    },
    {
      key: 'microsoft365',
      planName: 'Personal',
      amountMinor: 2650,
      categoryId: 'productivity',
      daysLeft: 23,
    },
    {
      key: 'adobe',
      planName: 'フォトプラン',
      amountMinor: 1280,
      categoryId: 'productivity',
      daysLeft: 28,
      lastUsedDaysAgo: 95,
    },
    {
      key: 'unext',
      planName: '月額プラン',
      amountMinor: 2189,
      categoryId: 'video_music',
      startDate: thisMonth,
      lastUsedDaysAgo: 65,
    },
    {
      key: 'hulu',
      name: 'Hulu',
      planName: '月額',
      amountMinor: 1026,
      categoryId: 'video_music',
      daysLeft: 10,
      cancelledMonthsAgo: 2,
    },
  ];

  const subscriptions: Subscription[] = [];
  const priceHistory: PriceHistoryEntry[] = [];

  specs.forEach((spec, index) => {
    const preset = popularServicesByKey[spec.key];
    const startDate = spec.startDate ?? addMonthsTo(addDays(today, spec.daysLeft ?? 0), -6);
    const nextRenewalDate =
      spec.daysLeft !== undefined
        ? addDays(today, spec.daysLeft)
        : addCycles(startDate, monthly, 1);
    const id = `sample-${spec.key}`;
    const createdAt = new Date(Date.UTC(2025, 0, 1, 0, 0, index)).toISOString();
    const cancelledAt =
      spec.cancelledMonthsAgo !== undefined
        ? new Date(`${addMonthsTo(today, -spec.cancelledMonthsAgo)}T03:00:00.000Z`).toISOString()
        : null;

    subscriptions.push({
      id,
      serviceKey: preset ? spec.key : null,
      name: spec.name ?? preset?.name ?? spec.key,
      planName: spec.planName,
      amountMinor: spec.amountMinor,
      currency: 'JPY',
      cycle: monthly,
      startDate,
      nextRenewalDate,
      categoryId: spec.categoryId,
      icon: {
        type: 'monogram',
        value: preset?.monogram ?? null,
        color: preset?.brandColor ?? null,
      },
      paymentMethodId: null,
      url: preset?.url ?? null,
      memo: spec.memo ?? null,
      notification: { enabled: true, daysBefore: 3, time: '09:00' },
      status: cancelledAt ? 'cancelled' : 'active',
      cancelledAt,
      lastUsedDate:
        spec.lastUsedDaysAgo !== undefined ? addDays(today, -spec.lastUsedDaysAgo) : null,
      createdAt,
      updatedAt: createdAt,
    });
    priceHistory.push({
      id: `${id}-h0`,
      subscriptionId: id,
      amountMinor: spec.key === 'netflix' ? 1490 : spec.amountMinor,
      currency: 'JPY',
      cycle: monthly,
      effectiveFrom: startDate,
    });
  });

  // 前月比の確認用：Netflix を今月から値上げ（1,490 → 1,590）
  priceHistory.push({
    id: 'sample-netflix-h1',
    subscriptionId: 'sample-netflix',
    amountMinor: 1590,
    currency: 'JPY',
    cycle: monthly,
    effectiveFrom: thisMonth,
  });

  return { subscriptions, priceHistory };
}
