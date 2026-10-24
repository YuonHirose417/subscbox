import type { TextStyle } from 'react-native';

/**
 * システムフォント（SF Pro / ヒラギノ）のみを使う。fontFamily は指定しない。
 * 金額系（display / callout / amount）は tabular-nums で桁を揃える。
 * サイズはカンプ（design/mockup.png）の実測値に合わせている。
 */
export const typography = {
  /** ホームの今月の支出（カンプ実測 48pt 相当） */
  display: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  /** 一覧のタイトル */
  largeTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  /** 下層画面のタイトル（分析・設定・見直し など） */
  screenTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  /** セクション見出し（まもなく更新・人気のサービス など） */
  section: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  /** 行のサービス名 */
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '600', fontVariant: ['tabular-nums'] },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  /** チップ・セグメントの文字 */
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '500' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Dynamic Type の拡大上限（レイアウト崩れ防止） */
export const maxFontSizeMultiplier = 1.4;
