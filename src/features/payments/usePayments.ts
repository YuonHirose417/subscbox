import type { Payment } from '@/domain/types';

import { usePaymentStore } from './store';

/** 支払い履歴（削除済みを含む生データ。表示時は visiblePayments() を通す） */
export function usePayments(): Payment[] {
  return usePaymentStore((s) => s.items);
}
