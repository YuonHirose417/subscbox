import type { TextStyle } from 'react-native';

/**
 * システムフォント（SF Pro / ヒラギノ）のみを使う。fontFamily は指定しない。
 * 金額系（display / callout / amount）は tabular-nums で桁を揃える。
 */
export const typography = {
  display: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  largeTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '600', fontVariant: ['tabular-nums'] },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '500' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Dynamic Type の拡大上限（レイアウト崩れ防止） */
export const maxFontSizeMultiplier = 1.4;
