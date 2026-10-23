import type { PaymentMethod, PaymentMethodInput } from '@/domain/types';
import { AppError } from '@/utils/errors';

import type { Db } from '../adapter';
import { rowToPaymentMethod, type PaymentMethodRow } from '../mappers';
import { insert } from '../sql';

const TYPES = new Set(['credit_card', 'debit_card', 'apple_id', 'carrier', 'other']);

function validate(input: PaymentMethodInput) {
  if (!TYPES.has(input.type))
    throw new AppError('VALIDATION', '支払い方法の種類を選択してください');
  if (input.last4 !== null && !/^\d{4}$/.test(input.last4)) {
    throw new AppError('VALIDATION', '下4桁は数字4桁で入力してください');
  }
  if (input.label && input.label.trim().length > 30) {
    throw new AppError('VALIDATION', '名前は30文字以内で入力してください');
  }
}

export class PaymentMethodRepository {
  constructor(
    private readonly db: Db,
    private readonly generateId: () => string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(): Promise<PaymentMethod[]> {
    const rows = await this.db.all<PaymentMethodRow>(
      'SELECT * FROM payment_methods ORDER BY sort_order, created_at',
    );
    return rows.map(rowToPaymentMethod);
  }

  /** 件数上限の判定は呼び出し側で行う */
  async create(input: PaymentMethodInput): Promise<PaymentMethod> {
    validate(input);
    const id = this.generateId();
    const timestamp = this.now().toISOString();
    const max = await this.db.first<{ m: number | null }>(
      'SELECT MAX(sort_order) AS m FROM payment_methods',
    );
    await this.db.transaction(async (tx) => {
      await insert(tx, 'payment_methods', {
        id,
        type: input.type,
        label: input.label?.trim() || null,
        last4: input.last4,
        sort_order: (max?.m ?? 0) + 1,
        created_at: timestamp,
        updated_at: timestamp,
      });
    });
    const row = await this.db.first<PaymentMethodRow>(
      'SELECT * FROM payment_methods WHERE id = ?',
      [id],
    );
    return rowToPaymentMethod(row!);
  }

  /** 削除すると、使っていたサブスクの支払い方法は未設定になる（ON DELETE SET NULL） */
  async remove(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const { changes } = await tx.run('DELETE FROM payment_methods WHERE id = ?', [id]);
      if (changes === 0) throw new AppError('NOT_FOUND', `payment method ${id} not found`);
    });
  }
}
