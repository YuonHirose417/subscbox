import { rollForwardRenewal } from '@/domain/billing';
import { today as todayString } from '@/domain/dates';
import type {
  DateString,
  PriceHistoryEntry,
  Subscription,
  SubscriptionInput,
} from '@/domain/types';
import { toInput } from '@/domain/subscription';
import { validateSubscriptionInput } from '@/domain/validation';
import { AppError } from '@/utils/errors';

import type { StatusFilter, SubscriptionRepository } from './SubscriptionRepository';

type Options = {
  generateId?: () => string;
  now?: () => Date;
};

let counter = 0;
const defaultId = () => `mem-${Date.now().toString(36)}-${(counter += 1)}`;

// 値はすべて JSON で表せるので JSON で複製する（呼び出し側の変更が内部状態に漏れないように）
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** メモリ上の実装（フェーズ2のUI開発とテスト用）。SQLite 実装と同じ振る舞いをする */
export class InMemorySubscriptionRepository implements SubscriptionRepository {
  private items: Subscription[];
  private history: PriceHistoryEntry[];
  private readonly generateId: () => string;
  private readonly now: () => Date;

  constructor(
    seed: { subscriptions?: Subscription[]; priceHistory?: PriceHistoryEntry[] } = {},
    options: Options = {},
  ) {
    this.items = clone(seed.subscriptions ?? []);
    this.history = clone(seed.priceHistory ?? []);
    this.generateId = options.generateId ?? defaultId;
    this.now = options.now ?? (() => new Date());
  }

  async list(filter: { status?: StatusFilter } = {}): Promise<Subscription[]> {
    const status = filter.status ?? 'all';
    return clone(
      this.items
        .filter((s) => status === 'all' || s.status === status)
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0)),
    );
  }

  async getById(id: string): Promise<Subscription | null> {
    const found = this.items.find((s) => s.id === id);
    return found ? clone(found) : null;
  }

  async create(input: SubscriptionInput): Promise<Subscription> {
    this.assertValid(input);
    const timestamp = this.now().toISOString();
    const sub: Subscription = {
      ...clone(input),
      id: this.generateId(),
      status: 'active',
      cancelledAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.items.push(sub);
    this.history.push(this.historyEntry(sub, sub.startDate));
    return clone(sub);
  }

  async update(id: string, input: Partial<SubscriptionInput>): Promise<Subscription> {
    const index = this.items.findIndex((s) => s.id === id);
    if (index < 0) throw new AppError('NOT_FOUND', `subscription ${id} not found`);
    const current = this.items[index];
    const merged: SubscriptionInput = { ...toInput(current), ...clone(input) };
    this.assertValid(merged);

    const next: Subscription = {
      ...merged,
      id,
      status: current.status,
      cancelledAt: current.cancelledAt,
      createdAt: current.createdAt,
      updatedAt: this.now().toISOString(),
    };
    const priceChanged =
      next.amountMinor !== current.amountMinor ||
      next.currency !== current.currency ||
      next.cycle.unit !== current.cycle.unit ||
      next.cycle.interval !== current.cycle.interval;
    if (priceChanged) this.history.push(this.historyEntry(next, todayString(this.now())));
    this.items[index] = next;
    return clone(next);
  }

  async remove(id: string): Promise<void> {
    if (!this.items.some((s) => s.id === id)) {
      throw new AppError('NOT_FOUND', `subscription ${id} not found`);
    }
    this.items = this.items.filter((s) => s.id !== id);
    this.history = this.history.filter((h) => h.subscriptionId !== id);
  }

  async duplicate(id: string): Promise<Subscription> {
    const source = await this.getById(id);
    if (!source) throw new AppError('NOT_FOUND', `subscription ${id} not found`);
    const input = toInput(source);
    return this.create({ ...input, name: `${input.name}（コピー）`.slice(0, 50) });
  }

  async cancel(id: string, at: string): Promise<Subscription> {
    const index = this.items.findIndex((s) => s.id === id);
    if (index < 0) throw new AppError('NOT_FOUND', `subscription ${id} not found`);
    const next: Subscription = {
      ...this.items[index],
      status: 'cancelled',
      cancelledAt: at,
      updatedAt: this.now().toISOString(),
    };
    this.items[index] = next;
    return clone(next);
  }

  async getPriceHistory(): Promise<PriceHistoryEntry[]> {
    return clone(this.history);
  }

  async rollForwardRenewals(today: DateString): Promise<number> {
    let count = 0;
    this.items = this.items.map((sub) => {
      if (sub.status !== 'active') return sub;
      const next = rollForwardRenewal(sub, today);
      if (next === sub.nextRenewalDate) return sub;
      count += 1;
      return { ...sub, nextRenewalDate: next, updatedAt: this.now().toISOString() };
    });
    return count;
  }

  private assertValid(input: SubscriptionInput) {
    const errors = validateSubscriptionInput(input);
    if (Object.keys(errors).length > 0) {
      throw new AppError('VALIDATION', Object.values(errors).join(' / '));
    }
  }

  private historyEntry(sub: Subscription, effectiveFrom: DateString): PriceHistoryEntry {
    return {
      id: this.generateId(),
      subscriptionId: sub.id,
      amountMinor: sub.amountMinor,
      currency: sub.currency,
      cycle: { ...sub.cycle },
      effectiveFrom,
    };
  }
}
