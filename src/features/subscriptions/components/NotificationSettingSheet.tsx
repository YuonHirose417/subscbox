import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { StyleSheet, View } from 'react-native';

import { Card, Chip, FormRow, Sheet } from '@/components/ui';
import type { NotificationSetting } from '@/domain/types';
import { useTheme } from '@/theme';

type Props = {
  visible: boolean;
  value: NotificationSetting;
  onChange: (value: NotificationSetting) => void;
  onClose: () => void;
};

export const NOTIFY_DAY_OPTIONS = [
  { days: 0, label: '当日' },
  { days: 1, label: '1日前' },
  { days: 3, label: '3日前' },
  { days: 7, label: '7日前' },
] as const;

const pad = (n: number) => String(n).padStart(2, '0');

export function timeToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function dateToTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function notifyDaysLabel(days: number): string {
  return days === 0 ? '当日' : `${days}日前`;
}

/** 通知のタイミング（何日前・時刻）を変えるシート */
export function NotificationSettingSheet({ visible, value, onChange, onClose }: Props) {
  const { spacing, accent, scheme } = useTheme();
  return (
    <Sheet visible={visible} title="通知のタイミング" onClose={onClose}>
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <FormRow label="何日前に通知するか" stacked separator>
          <View style={[styles.wrap, { gap: spacing.xs }]}>
            {NOTIFY_DAY_OPTIONS.map((d) => (
              <Chip
                key={d.days}
                label={d.label}
                selected={value.daysBefore === d.days}
                onPress={() => onChange({ ...value, daysBefore: d.days })}
              />
            ))}
          </View>
        </FormRow>
        <FormRow label="時刻">
          <DateTimePicker
            value={timeToDate(value.time)}
            mode="time"
            display="compact"
            locale="ja-JP"
            accentColor={accent.primary}
            themeVariant={scheme}
            onValueChange={(_e, date) => onChange({ ...value, time: dateToTime(date) })}
          />
        </FormRow>
      </Card>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
