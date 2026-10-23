import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** 追加モーダル内のスタック：サービス選択 → カテゴリ別一覧 → 入力フォーム */
export default function AddLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
