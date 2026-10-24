import { billingDatesInRange } from './billing';
import { addDays, compareDate, parseDate, today as todayOf } from './dates';
import { formatMinor } from './money';
import type { DateString, NotificationSetting, Subscription } from './types';

/** iOS のローカル通知の予約上限は 64 件。余裕を持って直近 50 件までにする */
export const MAX_SCHEDULED_NOTIFICATIONS = 50;
/** 何日先の更新まで予約するか（起動・復帰・変更のたびに入れ替えるので1年あれば足りる） */
export const NOTIFICATION_HORIZON_DAYS = 366;

export type NotificationPlan = {
  subscriptionId: string;
  renewalDate: DateString;
  fireAt: Date;
  title: string;
  body: string;
};

/**
 * サブスクに適用する通知設定。全体設定のオフは全サブスクに優先する。
 * 無料版は全サブスクに全体設定を一律で適用し、プレミアムはサブスクごとの設定を使う。
 */
export function effectiveNotification(
  sub: Pick<Subscription, 'notification'>,
  defaults: NotificationSetting,
  isPremium: boolean,
): NotificationSetting {
  if (!defaults.enabled) return { ...defaults, enabled: false };
  return isPremium ? sub.notification : defaults;
}

/** 更新日の N 日前の指定時刻（端末のローカル時刻） */
export function fireDateFor(renewalDate: DateString, setting: NotificationSetting): Date {
  const date = parseDate(addDays(renewalDate, -setting.daysBefore));
  const [h, m] = setting.time.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
}

export function notificationBody(
  sub: Pick<Subscription, 'name' | 'amountMinor' | 'currency'>,
  daysBefore: number,
): string {
  const when = daysBefore === 0 ? '今日' : `${daysBefore}日後に`;
  return `${sub.name}（${formatMinor(sub.amountMinor, sub.currency)}）が${when}更新されます`;
}

/** 今後の更新日：登録された次回更新日と、それ以降の周期ごとの請求日 */
export function upcomingRenewalDates(sub: Subscription, until: DateString): DateString[] {
  if (compareDate(sub.nextRenewalDate, until) > 0) return [];
  const later = billingDatesInRange(sub, addDays(sub.nextRenewalDate, 1), until);
  return [sub.nextRenewalDate, ...later];
}

/**
 * 予約すべき通知を、発火時刻の早い順に最大 limit 件まで計算する。
 * 解約済み・通知オフのサブスクと、すでに過ぎた時刻の通知は含めない。
 */
export function planNotifications(params: {
  subscriptions: readonly Subscription[];
  defaults: NotificationSetting;
  isPremium: boolean;
  now: Date;
  limit?: number;
}): NotificationPlan[] {
  const { subscriptions, defaults, isPremium, now, limit = MAX_SCHEDULED_NOTIFICATIONS } = params;
  const until = addDays(todayOf(now), NOTIFICATION_HORIZON_DAYS);
  const plans: NotificationPlan[] = [];
  for (const sub of subscriptions) {
    if (sub.status !== 'active') continue;
    const setting = effectiveNotification(sub, defaults, isPremium);
    if (!setting.enabled) continue;
    for (const renewalDate of upcomingRenewalDates(sub, until)) {
      const fireAt = fireDateFor(renewalDate, setting);
      if (fireAt.getTime() <= now.getTime()) continue;
      plans.push({
        subscriptionId: sub.id,
        renewalDate,
        fireAt,
        title: 'まもなく更新',
        body: notificationBody(sub, setting.daysBefore),
      });
    }
  }
  plans.sort(
    (a, b) =>
      a.fireAt.getTime() - b.fireAt.getTime() || a.subscriptionId.localeCompare(b.subscriptionId),
  );
  return plans.slice(0, limit);
}
