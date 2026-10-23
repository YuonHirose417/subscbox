import { formatTick, niceTicks } from '@/components/charts/scale';

describe('niceTicks', () => {
  it('matches the mockup axis', () => {
    expect(niceTicks(12340)).toEqual([0, 5000, 10000, 15000]);
  });

  it('chooses round steps for other ranges', () => {
    expect(niceTicks(900)).toEqual([0, 500, 1000, 1500]);
    expect(niceTicks(150)).toEqual([0, 50, 100, 150]);
    expect(niceTicks(148080)).toEqual([0, 50000, 100000, 150000]);
    expect(niceTicks(0)).toEqual([0, 1000, 2000, 3000]);
  });

  it('formats tick labels', () => {
    expect(formatTick(15000)).toBe('15,000');
    expect(formatTick(150000)).toBe('15万');
    expect(formatTick(125000)).toBe('12.5万');
  });
});
