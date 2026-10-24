import type { Db } from '../adapter';
import { insert } from '../sql';

export type ScheduledNotification = {
  notificationId: string;
  subscriptionId: string;
  /** ISO 8601 */
  fireAt: string;
};

/** 予約済み通知の対応表（scheduled_notifications）。解除・入れ替えの確認用 */
export class NotificationRepository {
  constructor(private readonly db: Db) {}

  async list(): Promise<ScheduledNotification[]> {
    const rows = await this.db.all<{
      notification_id: string;
      subscription_id: string;
      fire_at: string;
    }>('SELECT * FROM scheduled_notifications ORDER BY fire_at');
    return rows.map((r) => ({
      notificationId: r.notification_id,
      subscriptionId: r.subscription_id,
      fireAt: r.fire_at,
    }));
  }

  /** 対応表を丸ごと入れ替える（存在しないサブスクの行は外部キーで弾かれるため除外する） */
  async replaceAll(items: readonly ScheduledNotification[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.run('DELETE FROM scheduled_notifications');
      for (const item of items) {
        const exists = await tx.first<{ id: string }>('SELECT id FROM subscriptions WHERE id = ?', [
          item.subscriptionId,
        ]);
        if (!exists) continue;
        await insert(tx, 'scheduled_notifications', {
          notification_id: item.notificationId,
          subscription_id: item.subscriptionId,
          fire_at: item.fireAt,
        });
      }
    });
  }
}
