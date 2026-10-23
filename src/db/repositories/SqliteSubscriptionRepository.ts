import { rollForwardRenewal } from '@/domain/billing';
import { today as todayString } from '@/domain/dates';
import { toInput } from '@/domain/subscription';
import type {
  DateString,
  PriceHistoryEntry,
  Subscription,
  SubscriptionInput,
} from '@/domain/types';
import { validateSubscriptionInput } from '@/domain/validation';
import { AppError, isAppError } from '@/utils/errors';

import type { Db } from '../adapter';
import {
  inputToColumns,
  rowToPriceHistory,
  rowToSubscription,
  type PriceHistoryRow,
  type SubscriptionRow,
} from '../mappers';
import { insert } from '../sql';
import type { StatusFilter, SubscriptionRepository } from './SubscriptionRepository';

type Options = { generateId: () => string; now?: () => Date };

/** DB 例外を AppError に包む（AppError はそのまま） */
async function guard<T>(code: 'DB_READ' | 'DB_WRITE', task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (isAppError(error)) throw error;
    throw new AppError(code, `subscription repository: ${code}`, error);
  }
}

export class SqliteSubscriptionRepository implements SubscriptionRepository {
  private readonly generateId: () => string;
  private readonly now: () => Date;

  constructor(
    private readonly db: Db,
    options: Options,
  ) {
    this.generateId = options.generateId;
    this.now = options.now ?? (() => new Date());
  }

  list(filter: { status?: StatusFilter } = {}): Promise<Subscription[]> {
    return guard('DB_READ', async () => {
      const status = filter.status ?? 'all';
      const rows =
        status === 'all'
          ? await this.db.all<SubscriptionRow>(
              'SELECT * FROM subscriptions ORDER BY created_at, rowid',
            )
          : await this.db.all<SubscriptionRow>(
              'SELECT * FROM subscriptions WHERE status = ? ORDER BY created_at, rowid',
              [status],
            );
      return rows.map(rowToSubscription);
    });
  }

  getById(id: string): Promise<Subscription | null> {
    return guard('DB_READ', async () => {
      const row = await this.db.first<SubscriptionRow>('SELECT * FROM subscriptions WHERE id = ?', [
        id,
      ]);
      return row ? rowToSubscription(row) : null;
    });
  }

  create(input: SubscriptionInput): Promise<Subscription> {
    return guard('DB_WRITE', async () => {
      assertValid(input);
      const id = this.generateId();
      const timestamp = this.now().toISOString();
      const columns = {
        ...inputToColumns(input),
        id,
        status: 'active',
        created_at: timestamp,
        updated_at: timestamp,
      };
      await this.db.transaction(async (tx) => {
        await insert(tx, 'subscriptions', columns);
        await this.insertHistory(tx, id, input, input.startDate, timestamp);
      });
      return this.mustGet(id);
    });
  }

  update(id: string, patch: Partial<SubscriptionInput>): Promise<Subscription> {
    return guard('DB_WRITE', async () => {
      const current = await this.mustGet(id);
      const merged: SubscriptionInput = { ...toInput(current), ...patch };
      assertValid(merged);
      const timestamp = this.now().toISOString();
      const columns = inputToColumns(merged);
      const keys = Object.keys(columns);
      const priceChanged =
        merged.amountMinor !== current.amountMinor ||
        merged.currency !== current.currency ||
        merged.cycle.unit !== current.cycle.unit ||
        merged.cycle.interval !== current.cycle.interval;

      await this.db.transaction(async (tx) => {
        await tx.run(
          `UPDATE subscriptions SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`,
          [...keys.map((k) => columns[k]), timestamp, id],
        );
        if (priceChanged) {
          await this.insertHistory(tx, id, merged, todayString(this.now()), timestamp);
        }
      });
      return this.mustGet(id);
    });
  }

  remove(id: string): Promise<void> {
    return guard('DB_WRITE', async () => {
      await this.db.transaction(async (tx) => {
        const { changes } = await tx.run('DELETE FROM subscriptions WHERE id = ?', [id]);
        if (changes === 0) throw new AppError('NOT_FOUND', `subscription ${id} not found`);
      });
    });
  }

  duplicate(id: string): Promise<Subscription> {
    return guard('DB_WRITE', async () => {
      const source = await this.mustGet(id);
      const input = toInput(source);
      return this.create({ ...input, name: `${input.name}（コピー）`.slice(0, 50) });
    });
  }

  cancel(id: string, at: string): Promise<Subscription> {
    return guard('DB_WRITE', async () => {
      await this.mustGet(id);
      await this.db.transaction(async (tx) => {
        await tx.run(
          "UPDATE subscriptions SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?",
          [at, this.now().toISOString(), id],
        );
      });
      return this.mustGet(id);
    });
  }

  /** 解約済みを契約中に戻す（解約日はクリア） */
  reactivate(id: string): Promise<Subscription> {
    return guard('DB_WRITE', async () => {
      await this.mustGet(id);
      await this.db.transaction(async (tx) => {
        await tx.run(
          "UPDATE subscriptions SET status = 'active', cancelled_at = NULL, updated_at = ? WHERE id = ?",
          [this.now().toISOString(), id],
        );
      });
      return this.mustGet(id);
    });
  }

  getPriceHistory(): Promise<PriceHistoryEntry[]> {
    return guard('DB_READ', async () => {
      const rows = await this.db.all<PriceHistoryRow>(
        'SELECT * FROM price_history ORDER BY subscription_id, effective_from, created_at',
      );
      return rows.map(rowToPriceHistory);
    });
  }

  rollForwardRenewals(today: DateString): Promise<number> {
    return guard('DB_WRITE', async () => {
      const rows = await this.db.all<SubscriptionRow>(
        "SELECT * FROM subscriptions WHERE status = 'active' AND next_renewal_date < ?",
        [today],
      );
      if (rows.length === 0) return 0;
      const timestamp = this.now().toISOString();
      let count = 0;
      await this.db.transaction(async (tx) => {
        for (const row of rows) {
          const sub = rowToSubscription(row);
          const next = rollForwardRenewal(sub, today);
          if (next === sub.nextRenewalDate) continue;
          await tx.run(
            'UPDATE subscriptions SET next_renewal_date = ?, updated_at = ? WHERE id = ?',
            [next, timestamp, sub.id],
          );
          count += 1;
        }
      });
      return count;
    });
  }

  private async mustGet(id: string): Promise<Subscription> {
    const sub = await this.getById(id);
    if (!sub) throw new AppError('NOT_FOUND', `subscription ${id} not found`);
    return sub;
  }

  private insertHistory(
    tx: Db,
    subscriptionId: string,
    input: SubscriptionInput,
    effectiveFrom: DateString,
    timestamp: string,
  ) {
    return insert(tx, 'price_history', {
      id: this.generateId(),
      subscription_id: subscriptionId,
      amount_minor: input.amountMinor,
      currency: input.currency,
      cycle_unit: input.cycle.unit,
      cycle_interval: input.cycle.interval,
      effective_from: effectiveFrom,
      created_at: timestamp,
    });
  }
}

function assertValid(input: SubscriptionInput) {
  const errors = validateSubscriptionInput(input);
  if (Object.keys(errors).length > 0) {
    throw new AppError('VALIDATION', Object.values(errors).join(' / '));
  }
}
