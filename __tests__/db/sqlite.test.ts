import { LATEST_VERSION, migrate } from '@/db/migrations';
import { CategoryRepository } from '@/db/repositories/CategoryRepository';
import { PaymentMethodRepository } from '@/db/repositories/PaymentMethodRepository';
import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import { SqliteSubscriptionRepository } from '@/db/repositories/SqliteSubscriptionRepository';
import { toInput } from '@/domain/subscription';

import { makeSub } from '../domain/fixtures';
import { createNodeSqliteDb, loadNodeSqlite } from './nodeSqliteDb';

const run = loadNodeSqlite() ? describe : describe.skip;

async function setup() {
  const db = createNodeSqliteDb();
  await migrate(db);
  let n = 0;
  const generateId = () => `id-${(n += 1)}`;
  return {
    db,
    subs: new SqliteSubscriptionRepository(db, { generateId }),
    categories: new CategoryRepository(db, generateId),
    paymentMethods: new PaymentMethodRepository(db, generateId),
    settings: new SettingsRepository(db),
  };
}

run('migrations', () => {
  it('creates the schema with default categories and is idempotent', async () => {
    const { db, categories } = await setup();
    expect((await db.first<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(
      LATEST_VERSION,
    );
    expect((await categories.list()).map((c) => c.id)).toEqual([
      'video_music',
      'productivity',
      'cloud',
      'game',
      'sns',
      'other',
    ]);
    expect(await migrate(db)).toBe(LATEST_VERSION);
    expect(await categories.list()).toHaveLength(6);
  });

  it('enforces constraints at the database level', async () => {
    const { db } = await setup();
    await expect(
      db.run(
        `INSERT INTO payment_methods (id, type, last4, created_at, updated_at) VALUES ('x', 'credit_card', '12a4', 'n', 'n')`,
      ),
    ).rejects.toThrow();
  });
});

run('CategoryRepository', () => {
  it('adds custom categories and moves subscriptions to その他 on delete', async () => {
    const { categories, subs } = await setup();
    const custom = await categories.create({ name: '学習', color: '#000000', icon: 'book' });
    expect(custom.isDefault).toBe(false);
    expect(await categories.countCustom()).toBe(1);
    const sub = await subs.create(toInput(makeSub({ categoryId: custom.id })));
    await categories.remove(custom.id);
    expect((await subs.getById(sub.id))?.categoryId).toBe('other');
    await expect(categories.remove('video_music')).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

run('PaymentMethodRepository', () => {
  it('stores only the last 4 digits and clears references on delete', async () => {
    const { paymentMethods, subs } = await setup();
    const card = await paymentMethods.create({ type: 'credit_card', label: null, last4: '1234' });
    await expect(
      paymentMethods.create({ type: 'credit_card', label: null, last4: '4111111111111111' }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
    const sub = await subs.create(toInput(makeSub({ paymentMethodId: card.id })));
    expect((await subs.getById(sub.id))?.paymentMethodId).toBe(card.id);
    await paymentMethods.remove(card.id);
    expect((await subs.getById(sub.id))?.paymentMethodId).toBeNull();
  });
});

run('SettingsRepository', () => {
  it('round-trips JSON values', async () => {
    const { settings } = await setup();
    await settings.set('theme', 'dark');
    await settings.set('theme', 'light');
    await settings.set('rates', { USD: 150 });
    expect(await settings.getAll()).toEqual({ theme: 'light', rates: { USD: 150 } });
  });
});

run('SqliteSubscriptionRepository transactions', () => {
  it('rolls back when a write fails inside the transaction', async () => {
    const { subs, db } = await setup();
    await expect(
      subs.create(toInput(makeSub({ categoryId: 'missing-category' }))),
    ).rejects.toMatchObject({ code: 'DB_WRITE' });
    expect(await db.all('SELECT * FROM price_history')).toHaveLength(0);
    expect(await subs.list()).toHaveLength(0);
  });
});
