import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, FormRow, Sheet } from '@/components/ui';
import { parseDate, toDateString } from '@/domain/dates';
import { REVIEW_THRESHOLD_DAYS } from '@/domain/review';
import type { DateString } from '@/domain/types';
import { useTheme } from '@/theme';

type Props = {
  visible: boolean;
  value: DateString | null;
  today: DateString;
  onSave: (value: DateString | null) => void;
  onClose: () => void;
};

/** 最終利用日の記録（見直し候補の判定に使う。利用状況は自動では取得しない） */
export function LastUsedSheet({ visible, value, today, onSave, onClose }: Props) {
  return (
    <Sheet visible={visible} title="最終利用日" onClose={onClose}>
      {visible ? (
        <LastUsedForm value={value} today={today} onSave={onSave} onClose={onClose} />
      ) : null}
    </Sheet>
  );
}

function LastUsedForm({ value, today, onSave, onClose }: Omit<Props, 'visible'>) {
  const { spacing, accent, scheme } = useTheme();
  const [date, setDate] = useState<DateString>(value ?? today);
  const done = (next: DateString | null) => {
    onSave(next);
    onClose();
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Button title="今日使った" icon="checkmark" onPress={() => done(today)} />
      <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
        <FormRow label="日付を選ぶ">
          <DateTimePicker
            value={parseDate(date)}
            mode="date"
            display="compact"
            locale="ja-JP"
            accentColor={accent.primary}
            themeVariant={scheme}
            maximumDate={parseDate(today)}
            onValueChange={(_e, d) => setDate(toDateString(d))}
          />
        </FormRow>
      </Card>
      <Button title="この日付で記録する" variant="secondary" onPress={() => done(date)} />
      {value ? (
        <Button title="記録を消す" variant="destructive" onPress={() => done(null)} />
      ) : null}
      <AppText variant="caption" tone="tertiary">
        最終利用日から{REVIEW_THRESHOLD_DAYS}
        日以上たつと「使っていない可能性のあるサブスク」に表示されます。利用状況は自動では取得しないため、使ったときに記録してください。
      </AppText>
    </View>
  );
}
