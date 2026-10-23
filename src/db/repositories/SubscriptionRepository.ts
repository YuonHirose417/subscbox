import type {
  DateString,
  PriceHistoryEntry,
  Subscription,
  SubscriptionInput,
} from '@/domain/types';

export type StatusFilter = 'active' | 'cancelled' | 'all';

/**
 * サブスクの永続化。失敗時は AppError（DB_READ / DB_WRITE / VALIDATION / NOT_FOUND）を投げる。
 * 実装：InMemorySubscriptionRepository（フェーズ2・テスト）、SqliteSubscriptionRepository（フェーズ3）
 */
export interface SubscriptionRepository {
  /** 登録順（createdAt 昇順） */
  list(filter?: { status?: StatusFilter }): Promise<Subscription[]>;
  getById(id: string): Promise<Subscription | null>;
  /** price_history も同一トランザクションで作成 */
  create(input: SubscriptionInput): Promise<Subscription>;
  /** 金額・通貨・周期の変更時は price_history を追加 */
  update(id: string, input: Partial<SubscriptionInput>): Promise<Subscription>;
  remove(id: string): Promise<void>;
  duplicate(id: string): Promise<Subscription>;
  /** status=cancelled、cancelled_at を記録 */
  cancel(id: string, at: string): Promise<Subscription>;
  /** 解約済みを契約中に戻す（解約日はクリア） */
  reactivate(id: string): Promise<Subscription>;
  getPriceHistory(): Promise<PriceHistoryEntry[]>;
  /** 過去日になった次回更新日を繰り越し、件数を返す */
  rollForwardRenewals(today: DateString): Promise<number>;
}
