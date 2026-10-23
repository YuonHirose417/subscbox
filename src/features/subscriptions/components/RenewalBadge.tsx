import type { StyleProp, ViewStyle } from 'react-native';

import { Badge } from '@/components/ui';
import { formatDaysLeft } from '@/domain/dates';

import { renewalBadgeTone } from '../renewalBadge';

type Props = { daysLeft: number; style?: StyleProp<ViewStyle> };

/** 「あと3日」等。7日以内=赤、8〜14日=緑、15日以上=青 */
export function RenewalBadge({ daysLeft, style }: Props) {
  return <Badge label={formatDaysLeft(daysLeft)} tone={renewalBadgeTone(daysLeft)} style={style} />;
}
