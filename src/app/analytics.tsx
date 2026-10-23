import { useState } from 'react';

import { Card, EmptyState, Screen, ScreenHeader, SegmentedControl } from '@/components/ui';
import { ja } from '@/i18n/ja';

type Period = 'month' | 'year' | 'all';

const PERIODS = [
  { value: 'month', label: ja.period.month },
  { value: 'year', label: ja.period.year },
  { value: 'all', label: ja.period.all },
] as const;

/** 支出の分析（フェーズ1はプレースホルダー。本実装はフェーズ4） */
export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('month');
  return (
    <Screen>
      <ScreenHeader showBack title={ja.screens.analytics.title} />
      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />
      <Card>
        <EmptyState icon="chart.bar" title={ja.empty.analyticsTitle} />
      </Card>
    </Screen>
  );
}
