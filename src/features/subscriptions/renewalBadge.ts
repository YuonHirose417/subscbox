import type { BadgeTone } from '@/components/ui';

/** 期限バッジの色のしきい値（カンプ準拠）。残り日数は今日=0 */
export const RENEWAL_BADGE_THRESHOLDS = {
  /** この日数以内は赤 */
  urgentMaxDays: 7,
  /** この日数以内は緑（urgentMaxDays より大きい場合） */
  soonMaxDays: 14,
} as const;

/** 7日以内=赤、8〜14日=緑、15日以上=青 */
export function renewalBadgeTone(daysLeft: number): BadgeTone {
  if (daysLeft <= RENEWAL_BADGE_THRESHOLDS.urgentMaxDays) return 'negative';
  if (daysLeft <= RENEWAL_BADGE_THRESHOLDS.soonMaxDays) return 'positive';
  return 'info';
}
