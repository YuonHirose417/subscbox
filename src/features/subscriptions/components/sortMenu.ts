import { ActionSheetIOS, Alert, Platform } from 'react-native';

import type { SortOrder } from '@/domain/types';

export const SORT_LABELS: Record<SortOrder, string> = {
  renewal: '次回更新日順',
  amountDesc: '金額が高い順',
  amountAsc: '金額が安い順',
  name: '名前順',
  created: '登録日順',
};

const SORT_OPTIONS: SortOrder[] = ['renewal', 'amountDesc', 'amountAsc', 'name', 'created'];

type Params = {
  current: SortOrder;
  isPremium: boolean;
  includeCancelled: boolean;
  onSort: (order: SortOrder) => void;
  onToggleCancelled: () => void;
  onRequirePremium: () => void;
};

/** 並び替え・解約済みの表示切替のメニュー（iOS はネイティブのアクションシート） */
export function showSortMenu({
  current,
  isPremium,
  includeCancelled,
  onSort,
  onToggleCancelled,
  onRequirePremium,
}: Params) {
  const sortLabels = SORT_OPTIONS.map((o) => {
    const label = SORT_LABELS[o];
    if (!isPremium) return o === 'created' ? `${label}（無料版）` : `${label}（プレミアム）`;
    return o === current ? `✓ ${label}` : label;
  });
  const cancelledLabel = includeCancelled ? '解約済みを隠す' : '解約済みも表示';
  const options = [...sortLabels, cancelledLabel, 'キャンセル'];

  const handle = (index: number) => {
    if (index < SORT_OPTIONS.length) {
      const order = SORT_OPTIONS[index];
      if (!isPremium && order !== 'created') onRequirePremium();
      else onSort(order);
    } else if (index === SORT_OPTIONS.length) {
      onToggleCancelled();
    }
  };

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { title: '並び替え・表示', options, cancelButtonIndex: options.length - 1 },
      handle,
    );
    return;
  }
  Alert.alert(
    '並び替え・表示',
    undefined,
    options.slice(0, -1).map((text, index) => ({ text, onPress: () => handle(index) })),
  );
}
