import { FREE_LIMITS, reachedSubscriptionLimit } from '@/features/premium/limits';

import { makeSub } from './fixtures';

describe('reachedSubscriptionLimit', () => {
  const active = (n: number) => Array.from({ length: n }, () => makeSub());

  it('counts only active subscriptions for free users', () => {
    expect(reachedSubscriptionLimit(active(FREE_LIMITS.subscriptions - 1), false)).toBe(false);
    expect(reachedSubscriptionLimit(active(FREE_LIMITS.subscriptions), false)).toBe(true);
    expect(
      reachedSubscriptionLimit(
        [...active(FREE_LIMITS.subscriptions - 1), makeSub({ status: 'cancelled' })],
        false,
      ),
    ).toBe(false);
  });

  it('never limits premium users', () => {
    expect(reachedSubscriptionLimit(active(FREE_LIMITS.subscriptions * 3), true)).toBe(false);
  });
});
