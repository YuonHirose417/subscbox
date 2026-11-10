import { buildSampleData } from '@/data/sampleSubscriptions';
import { migrate } from '@/db/migrations';
import { InMemorySubscriptionRepository } from '@/db/repositories/InMemorySubscriptionRepository';
import { SqliteSubscriptionRepository } from '@/db/repositories/SqliteSubscriptionRepository';
import type { SubscriptionRepository } from '@/db/repositories/SubscriptionRepository';
import { currentMonthlyTotal, monthOverMonth } from '@/domain/aggregation';
import { toInput } from '@/domain/subscription';
import type { SubscriptionInput } from '@/domain/types';
import { isAppError } from '@/utils/errors';

import { makeSub } from '../domain/fixtures';
import { createNodeSqliteDb, loadNodeSqlite } from './nodeSqliteDb';

/** Repository の共通テストスイート。InMemory と SQLite（node:sqlite）の両方に流す */
function repositorySuite(
  name: string,
  factory: (now: () => Date) => SubscriptionRepository | Promise<SubscriptionRepository>,
  run: typeof describe = describe,
) {
  run(name, () => {
    let clock = new Date('2025-10-17T00:00:00.000Z');
    const now = () => clock;
    let repo: SubscriptionRepository;
    const input = (overrides: Partial<SubscriptionInput> = {}): SubscriptionInput => ({
      ...toInput(makeSub({ startDate: '2025-01-31', nextRenewalDate: '2025-10-31' })),
      ...overrides,
    });

    beforeEach(async () => {
      clock = new Date('2025-10-17T00:00:00.000Z');
      repo = await factory(now);
    });

    it('creates and lists in registration order with initial price history', async () => {
      const a = await repo.create(input({ name: 'A' }));
      clock = new Date('2025-10-17T00:00:01.000Z');
      const b = await repo.create(input({ name: 'B' }));
      expect((await repo.list()).map((s) => s.id)).toEqual([a.id, b.id]);
      expect(a.status).toBe('active');
      const history = await repo.getPriceHistory();
      expect(history.filter((h) => h.subscriptionId === a.id)).toHaveLength(1);
      expect(history[0].effectiveFrom).toBe('2025-01-31');
    });

    it('rejects invalid input', async () => {
      await expect(repo.create(input({ amountMinor: 0 }))).rejects.toMatchObject({
        code: 'VALIDATION',
      });
      await expect(repo.create(input({ name: '  ' }))).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    });

    it('adds price history only when price or cycle changes', async () => {
      const sub = await repo.create(input());
      await repo.update(sub.id, { planName: 'プラン' });
      expect((await repo.getPriceHistory()).length).toBe(1);
      const updated = await repo.update(sub.id, { amountMinor: 1500 });
      expect(updated.amountMinor).toBe(1500);
      const history = await repo.getPriceHistory();
      expect(history).toHaveLength(2);
      expect(history[1]).toMatchObject({ amountMinor: 1500, effectiveFrom: '2025-10-17' });
    });

    it('returns copies so callers cannot mutate stored data', async () => {
      const sub = await repo.create(input());
      sub.name = 'mutated';
      expect((await repo.getById(sub.id))?.name).not.toBe('mutated');
    });

    it('removes, duplicates and cancels', async () => {
      const sub = await repo.create(input({ name: 'Netflix' }));
      const copy = await repo.duplicate(sub.id);
      expect(copy.id).not.toBe(sub.id);
      expect(copy.name).toBe('Netflix（コピー）');
      const cancelled = await repo.cancel(sub.id, '2025-10-17T01:00:00.000Z');
      expect(cancelled).toMatchObject({
        status: 'cancelled',
        cancelledAt: '2025-10-17T01:00:00.000Z',
      });
      expect(await repo.list({ status: 'active' })).toHaveLength(1);
      expect(await repo.list({ status: 'cancelled' })).toHaveLength(1);
      expect(await repo.reactivate(sub.id)).toMatchObject({ status: 'active', cancelledAt: null });
      await repo.cancel(sub.id, '2025-10-17T01:00:00.000Z');
      await repo.remove(sub.id);
      expect(await repo.getById(sub.id)).toBeNull();
      expect((await repo.getPriceHistory()).some((h) => h.subscriptionId === sub.id)).toBe(false);
    });

    it('throws NOT_FOUND for unknown ids', async () => {
      const error = await repo.update('missing', { name: 'x' }).catch((e: unknown) => e);
      expect(isAppError(error) && error.code).toBe('NOT_FOUND');
      await expect(repo.remove('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('rolls forward past renewals from the start date', async () => {
      const sub = await repo.create(input({ nextRenewalDate: '2025-02-28' }));
      expect(await repo.rollForwardRenewals('2025-04-15')).toBe(1);
      expect((await repo.getById(sub.id))?.nextRenewalDate).toBe('2025-04-30');
      expect(await repo.rollForwardRenewals('2025-04-15')).toBe(0);
    });
  });
}

repositorySuite('InMemorySubscriptionRepository', (now) => {
  let n = 0;
  return new InMemorySubscriptionRepository({}, { now, generateId: () => `id-${(n += 1)}` });
});

repositorySuite(
  'SqliteSubscriptionRepository (node:sqlite)',
  async (now) => {
    const db = createNodeSqliteDb();
    await migrate(db);
    let n = 0;
    return new SqliteSubscriptionRepository(db, { now, generateId: () => `id-${(n += 1)}` });
  },
  loadNodeSqlite() ? describe : describe.skip,
);

describe('sample data', () => {
  it('matches the mockup list (8 active, renewal badges relative to today)', () => {
    const now = new Date(2025, 9, 17, 12);
    const { subscriptions, priceHistory } = buildSampleData(now);
    const active = subscriptions.filter((s) => s.status === 'active');
    expect(active).toHaveLength(8);
    expect(active.slice(0, 7).map((s) => s.name)).toEqual([
      'Netflix',
      'YouTube Premium',
      'Spotify',
      'iCloud+',
      'Google One',
      'Microsoft 365',
      'Adobe Creative Cloud',
    ]);
    expect(active[0].nextRenewalDate).toBe('2025-10-20');
    expect(currentMonthlyTotal(subscriptions, {}).total).toBe(
      1590 + 1280 + 980 + 150 + 250 + 2650 + 1280 + 2189,
    );
    // U-NEXT の今月開始（+2,189）と Netflix の値上げ（+100）
    expect(monthOverMonth(subscriptions, priceHistory, {}, '2025-10-17')).toBe(2189 + 100);
  });
});
