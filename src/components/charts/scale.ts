/**
 * Y軸の目盛り（0 から始まる等間隔、きりのよい刻み）。
 * 例：最大 12,340・3目盛り → 0 / 5,000 / 10,000 / 15,000
 */
export function niceTicks(maxValue: number, intervals = 3): number[] {
  if (!(maxValue > 0)) return [0, 1, 2, 3].slice(0, intervals + 1).map((n) => n * 1000);
  const rough = maxValue / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s * intervals >= maxValue) ??
    10 * magnitude;
  return Array.from({ length: intervals + 1 }, (_, i) => i * step);
}

/** 目盛りラベル：「15,000」「1.2万」（10万以上は万単位） */
export function formatTick(value: number): string {
  if (value >= 100_000) {
    const man = value / 10_000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}万`;
  }
  return value.toLocaleString('ja-JP');
}
