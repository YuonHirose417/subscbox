import { SPLASH_MIN_VISIBLE_MS, splashHideDelay } from '@/features/app/splash';

describe('splashHideDelay', () => {
  it('waits for the rest of the minimum time when the app is ready early', () => {
    expect(splashHideDelay(1000, 1300)).toBe(SPLASH_MIN_VISIBLE_MS - 300);
    expect(splashHideDelay(1000, 1000)).toBe(SPLASH_MIN_VISIBLE_MS);
  });

  it('hides right away when preparing took longer than the minimum', () => {
    expect(splashHideDelay(1000, 1000 + SPLASH_MIN_VISIBLE_MS)).toBe(0);
    expect(splashHideDelay(1000, 5000)).toBe(0);
  });
});
