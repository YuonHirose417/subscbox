/** スプラッシュ画面を表示しておく最短の時間（ミリ秒） */
export const SPLASH_MIN_VISIBLE_MS = 1200;
/** スプラッシュ画面を消すときのフェードの時間（ミリ秒） */
export const SPLASH_FADE_MS = 400;

/**
 * 準備ができてから、スプラッシュ画面を消すまでに待つ時間。
 * 表示し始めてから最短時間に満たなければ残りを待ち、すでに過ぎていればすぐ消す（0）
 */
export function splashHideDelay(
  shownAt: number,
  now: number,
  minVisibleMs: number = SPLASH_MIN_VISIBLE_MS,
): number {
  return Math.max(0, minVisibleMs - (now - shownAt));
}
