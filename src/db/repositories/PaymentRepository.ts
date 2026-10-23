import { isDateString } from '@/domain/dates';
import { planPaymentSync } from '@/domain/payments';
import type { DateString, Payment, PriceHistoryEntry, Subscription } from '@/domain/types';
import { AppError } from '@/utils/errors';

import type { Db } from '../adapter';
import { rowToPayment, type PaymentRow } from '../mappers';
import { insert } from '../sql';

/** 支払い履歴（payments テーブル）。請求日から自動生成し、ユーザーが個別に修正・削除できる */
export class PaymentRepository {
  constructor(
    private readonly db: Db,
    private readonly generateId: () => string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** 削除済み（skipped）も含めてすべて */
  async listAll(): Promise<Payment[]> {
    const rows = await this.db.all<PaymentRow>('SELECT * FROM payments ORDER BY billed_on DESC');
    return rows.map(rowToPayment);
  }

  /** 全サブスクの支払い履歴を今日までの請求日に同期する。追加・削除した件数を返す */
  async sync(
    subs: readonly Subscription[],
    history: readonly PriceHistoryEntry[],
    today: DateString,
  ): Promise<{ inserted: number; deleted: number }> {
    const existing = await this.listAll();
    const plans = subs.map((sub) => planPaymentSync(sub, history, existing, today));
    const inserted = plans.reduce((n, p) => n + p.toInsert.length, 0);
    const deleted = plans.reduce((n, p) => n + p.toDeleteIds.length, 0);
    if (inserted + deleted === 0) return { inserted, deleted };

    const timestamp = this.now().toISOString();
    await this.db.transaction(async (tx) => {
      for (const plan of plans) {
        for (const id of plan.toDeleteIds) await tx.run('DELETE FROM payments WHERE id = ?', [id]);
        for (const draft of plan.toInsert) {
          await insert(tx, 'payments', {
            id: this.generateId(),
            subscription_id: draft.subscriptionId,
            billed_on: draft.billedOn,
            amount_minor: draft.amountMinor,
            currency: draft.currency,
            status: 'paid',
            is_user_edited: 0,
            created_at: timestamp,
            updated_at: timestamp,
          });
        }
      }
    });
    return { inserted, deleted };
  }

  /**
   * 金額・支払日の修正。支払日を変えた場合、元の日は削除扱い（再生成しない）にして新しい日の行を作る。
   */
  async edit(id: string, patch: { billedOn?: DateString; amountMinor?: number }): Promise<void> {
    const row = await this.db.first<PaymentRow>('SELECT * FROM payments WHERE id = ?', [id]);
    if (!row) throw new AppError('NOT_FOUND', `payment ${id} not found`);
    const billedOn = patch.billedOn ?? row.billed_on;
    const amountMinor = patch.amountMinor ?? row.amount_minor;
    if (!isDateString(billedOn)) throw new AppError('VALIDATION', '支払日を選択してください');
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
      throw new AppError('VALIDATION', '0より大きい金額を入力してください');
    }
    const timestamp = this.now().toISOString();

    await this.db.transaction(async (tx) => {
      if (billedOn === row.billed_on) {
        await tx.run(
          'UPDATE payments SET amount_minor = ?, is_user_edited = 1, updated_at = ? WHERE id = ?',
          [amountMinor, timestamp, id],
        );
        return;
      }
      const clash = await tx.first<PaymentRow>(
        'SELECT * FROM payments WHERE subscription_id = ? AND billed_on = ?',
        [row.subscription_id, billedOn],
      );
      if (clash && clash.status === 'paid') {
        throw new AppError('VALIDATION', 'その日の支払いはすでに記録されています');
      }
      if (clash) await tx.run('DELETE FROM payments WHERE id = ?', [clash.id]);
      await tx.run("UPDATE payments SET status = 'skipped', updated_at = ? WHERE id = ?", [
        timestamp,
        id,
      ]);
      await insert(tx, 'payments', {
        id: this.generateId(),
        subscription_id: row.subscription_id,
        billed_on: billedOn,
        amount_minor: amountMinor,
        currency: row.currency,
        status: 'paid',
        is_user_edited: 1,
        created_at: timestamp,
        updated_at: timestamp,
      });
    });
  }

  /** 削除（再生成されないよう skipped として残す） */
  async remove(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const { changes } = await tx.run(
        "UPDATE payments SET status = 'skipped', updated_at = ? WHERE id = ?",
        [this.now().toISOString(), id],
      );
      if (changes === 0) throw new AppError('NOT_FOUND', `payment ${id} not found`);
    });
  }
}
