import { defaultCategories } from '@/data/defaultCategories';
import type { BackupData } from '@/domain/backup';
import { toInput } from '@/domain/subscription';
import { AppError } from '@/utils/errors';

import type { Db } from '../adapter';
import {
  inputToColumns,
  rowToCategory,
  rowToPayment,
  rowToPaymentMethod,
  rowToPriceHistory,
  rowToSubscription,
  type CategoryRow,
  type PaymentMethodRow,
  type PaymentRow,
  type PriceHistoryRow,
  type SubscriptionRow,
} from '../mappers';
import { insert } from '../sql';

/** 子テーブルから順に消す（外部キー制約のため） */
const DELETE_ORDER = [
  'scheduled_notifications',
  'payments',
  'price_history',
  'subscriptions',
  'payment_methods',
  'categories',
  'exchange_rates',
  'settings',
] as const;

/** データの書き出し・復元・全削除。復元と全削除は1つのトランザクションで行い、失敗時はロールバックする */
export class DataTransferRepository {
  constructor(
    private readonly db: Db,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async exportAll(): Promise<BackupData> {
    try {
      const [categories, methods, subs, history, payments, settings] = await Promise.all([
        this.db.all<CategoryRow>('SELECT * FROM categories ORDER BY sort_order, created_at'),
        this.db.all<PaymentMethodRow>('SELECT * FROM payment_methods ORDER BY sort_order'),
        this.db.all<SubscriptionRow>('SELECT * FROM subscriptions ORDER BY created_at'),
        this.db.all<PriceHistoryRow>(
          'SELECT * FROM price_history ORDER BY subscription_id, effective_from',
        ),
        this.db.all<PaymentRow>('SELECT * FROM payments ORDER BY billed_on'),
        this.db.all<{ key: string; value: string }>('SELECT key, value FROM settings'),
      ]);
      const settingsObject: Record<string, unknown> = {};
      for (const row of settings) {
        try {
          settingsObject[row.key] = JSON.parse(row.value);
        } catch {
          // 壊れた値は書き出さない
        }
      }
      return {
        categories: categories.map(rowToCategory),
        paymentMethods: methods.map(rowToPaymentMethod),
        subscriptions: subs.map(rowToSubscription),
        priceHistory: history.map(rowToPriceHistory),
        payments: payments.map(rowToPayment),
        settings: settingsObject,
      };
    } catch (error) {
      throw new AppError('DB_READ', 'データを読み込めませんでした', error);
    }
  }

  /** 現在のデータをすべて消して、検証済みのバックアップで置き換える */
  async replaceAll(data: BackupData): Promise<void> {
    const timestamp = this.now().toISOString();
    try {
      await this.db.transaction(async (tx) => {
        for (const table of DELETE_ORDER) await tx.run(`DELETE FROM ${table}`);
        for (const c of data.categories) {
          await insert(tx, 'categories', {
            id: c.id,
            name: c.name,
            color: c.color,
            icon: c.icon,
            sort_order: c.sortOrder,
            is_default: c.isDefault ? 1 : 0,
            created_at: timestamp,
            updated_at: timestamp,
          });
        }
        await this.insertMissingDefaults(tx, timestamp);
        for (const m of data.paymentMethods) {
          await insert(tx, 'payment_methods', {
            id: m.id,
            type: m.type,
            label: m.label,
            last4: m.last4,
            sort_order: m.sortOrder,
            created_at: m.createdAt,
            updated_at: m.updatedAt,
          });
        }
        for (const s of data.subscriptions) {
          await insert(tx, 'subscriptions', {
            ...inputToColumns(toInput(s)),
            id: s.id,
            status: s.status,
            cancelled_at: s.cancelledAt,
            created_at: s.createdAt,
            updated_at: s.updatedAt,
          });
        }
        for (const h of data.priceHistory) {
          await insert(tx, 'price_history', {
            id: h.id,
            subscription_id: h.subscriptionId,
            amount_minor: h.amountMinor,
            currency: h.currency,
            cycle_unit: h.cycle.unit,
            cycle_interval: h.cycle.interval,
            effective_from: h.effectiveFrom,
            created_at: timestamp,
          });
        }
        for (const p of data.payments) {
          await insert(tx, 'payments', {
            id: p.id,
            subscription_id: p.subscriptionId,
            billed_on: p.billedOn,
            amount_minor: p.amountMinor,
            currency: p.currency,
            status: p.status,
            is_user_edited: p.isUserEdited ? 1 : 0,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
          });
        }
        for (const [key, value] of Object.entries(data.settings)) {
          await insert(tx, 'settings', { key, value: JSON.stringify(value) });
        }
      });
    } catch (error) {
      throw new AppError('DB_WRITE', 'データを復元できませんでした', error);
    }
  }

  /** すべてのデータを削除し、既定カテゴリだけの初期状態に戻す */
  async deleteAll(): Promise<void> {
    const timestamp = this.now().toISOString();
    try {
      await this.db.transaction(async (tx) => {
        for (const table of DELETE_ORDER) await tx.run(`DELETE FROM ${table}`);
        await this.insertMissingDefaults(tx, timestamp);
      });
    } catch (error) {
      throw new AppError('DB_WRITE', 'データを削除できませんでした', error);
    }
  }

  /** 既定カテゴリはアプリが前提にしているので、欠けていれば補う */
  private async insertMissingDefaults(tx: Db, timestamp: string): Promise<void> {
    for (const c of defaultCategories) {
      await tx.run(
        `INSERT OR IGNORE INTO categories (id, name, color, icon, sort_order, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [c.id, c.name, c.color, c.icon, c.sortOrder, timestamp, timestamp],
      );
    }
  }
}
