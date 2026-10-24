import {
  effectiveNotification,
  fireDateFor,
  MAX_SCHEDULED_NOTIFICATIONS,
  notificationBody,
  planNotifications,
  upcomingRenewalDates,
} from '@/domain/notifications';
import type { NotificationSetting } from '@/domain/types';

import { makeSub } from './fixtures';

const defaults: NotificationSetting = { enabled: true, daysBefore: 3, time: '09:00' };
// 2025-10-17 12:00（端末ローカル）
const now = new Date(2025, 9, 17, 12, 0, 0);

describe('effectiveNotification', () => {
  const sub = makeSub({ notification: { enabled: false, daysBefore: 7, time: '20:00' } });

  it('uses the global setting for free users', () => {
    expect(effectiveNotification(sub, defaults, false)).toEqual(defaults);
  });

  it('uses the per-subscription setting for premium users', () => {
    expect(effectiveNotification(sub, defaults, true)).toEqual(sub.notification);
  });

  it('turns everything off when the global switch is off', () => {
    const on = makeSub({ notification: { enabled: true, daysBefore: 1, time: '08:00' } });
    expect(effectiveNotification(on, { ...defaults, enabled: false }, true).enabled).toBe(false);
    expect(effectiveNotification(on, { ...defaults, enabled: false }, false).enabled).toBe(false);
  });
});

describe('fireDateFor / notificationBody', () => {
  it('fires N days before at the given local time', () => {
    expect(fireDateFor('2025-10-20', { enabled: true, daysBefore: 3, time: '09:30' })).toEqual(
      new Date(2025, 9, 17, 9, 30, 0),
    );
    expect(fireDateFor('2025-11-01', { enabled: true, daysBefore: 1, time: '21:05' })).toEqual(
      new Date(2025, 9, 31, 21, 5, 0),
    );
  });

  it('formats the message', () => {
    const sub = makeSub({ name: 'Netflix', amountMinor: 1590 });
    expect(notificationBody(sub, 3)).toBe('Netflix（¥1,590）が3日後に更新されます');
    expect(notificationBody(sub, 0)).toBe('Netflix（¥1,590）が今日更新されます');
    expect(notificationBody(makeSub({ name: 'X', amountMinor: 999, currency: 'USD' }), 1)).toBe(
      'X（$9.99）が1日後に更新されます',
    );
  });
});

describe('upcomingRenewalDates', () => {
  it('starts from the stored next renewal date, then follows the cycle', () => {
    const sub = makeSub({ startDate: '2025-01-31', nextRenewalDate: '2025-10-31' });
    expect(upcomingRenewalDates(sub, '2026-01-31')).toEqual([
      '2025-10-31',
      '2025-11-30',
      '2025-12-31',
      '2026-01-31',
    ]);
  });

  it('is empty when the next renewal is after the horizon', () => {
    expect(upcomingRenewalDates(makeSub({ nextRenewalDate: '2027-01-01' }), '2026-01-01')).toEqual(
      [],
    );
  });
});

describe('planNotifications', () => {
  it('skips cancelled, disabled and past notifications', () => {
    const plans = planNotifications({
      subscriptions: [
        // 10/20 更新 → 10/17 9:00 はもう過ぎている。次は 11/17 9:00
        makeSub({ id: 'a', startDate: '2025-01-20', nextRenewalDate: '2025-10-20' }),
        makeSub({ id: 'b', status: 'cancelled', nextRenewalDate: '2025-10-25' }),
        makeSub({
          id: 'c',
          nextRenewalDate: '2025-10-25',
          notification: { ...defaults, enabled: false },
        }),
      ],
      defaults,
      isPremium: true,
      now,
    });
    expect(plans.every((p) => p.subscriptionId === 'a')).toBe(true);
    expect(plans[0].renewalDate).toBe('2025-11-20');
    expect(plans[0].fireAt).toEqual(new Date(2025, 10, 17, 9, 0, 0));
    expect(plans.every((p) => p.fireAt.getTime() > now.getTime())).toBe(true);
  });

  it('includes a notification later today', () => {
    const plans = planNotifications({
      subscriptions: [makeSub({ id: 'a', nextRenewalDate: '2025-10-17', startDate: '2025-01-17' })],
      defaults: { enabled: true, daysBefore: 0, time: '18:00' },
      isPremium: false,
      now,
    });
    expect(plans[0].fireAt).toEqual(new Date(2025, 9, 17, 18, 0, 0));
    expect(plans[0].body).toContain('今日更新されます');
  });

  it('keeps only the nearest notifications up to the limit, sorted by time', () => {
    const weekly = Array.from({ length: 3 }, (_, i) =>
      makeSub({
        id: `w${i}`,
        cycle: { unit: 'week', interval: 1 },
        startDate: '2025-10-20',
        nextRenewalDate: '2025-10-20',
      }),
    );
    const plans = planNotifications({ subscriptions: weekly, defaults, isPremium: false, now });
    expect(plans).toHaveLength(MAX_SCHEDULED_NOTIFICATIONS);
    for (let i = 1; i < plans.length; i += 1) {
      expect(plans[i].fireAt.getTime()).toBeGreaterThanOrEqual(plans[i - 1].fireAt.getTime());
    }
    // 10/20 分（10/17 9:00）は過ぎているので 10/27 から
    expect(plans[0].renewalDate).toBe('2025-10-27');
  });

  it('returns nothing when notifications are globally off', () => {
    expect(
      planNotifications({
        subscriptions: [makeSub({ nextRenewalDate: '2025-10-30' })],
        defaults: { ...defaults, enabled: false },
        isPremium: true,
        now,
      }),
    ).toEqual([]);
  });
});
