/**
 * デザイントークン。色・余白・角丸・影・モーションの値はすべてここで定義し、
 * コンポーネントは useTheme() 経由で参照する（ここ以外で色リテラルを書かない）。
 * 初期値は仕様書4章とデザインカンプ（design/mockup.png）から読み取ったもの。
 */

export type ColorScheme = 'light' | 'dark';

export type Palette = {
  background: string;
  /** ホーム上部の柔らかい色の塊（青・ラベンダー・ピンク）。不透明度込みの色 */
  heroBlobs: readonly [string, string, string];
  surface: string;
  surfaceSecondary: string;
  border: string;
  hairline: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  /** グラデーションやアクセント面の上に載せる文字・アイコン */
  onAccent: string;
  /** 押下時・スケルトンの下地 */
  fill: string;
  skeletonHighlight: string;
  /** 暗い背景の上に置く半透明の円ボタン */
  glass: string;
  /** 詳細画面ヘッダー等の暗いオーバーレイ */
  scrim: readonly [string, string];
  /** 詳細画面ヘッダーの地（カンプ実測 紺〜スレート #1F2A3F） */
  headerBase: string;
  positive: string;
  negative: string;
  warning: string;
  info: string;
  positiveSoft: string;
  negativeSoft: string;
  warningSoft: string;
  infoSoft: string;
  /** 文字として使うときのセマンティック色（ライトは WCAG AA 4.5:1 を満たすよう濃くする） */
  negativeText: string;
  positiveText: string;
  warningText: string;
  infoText: string;
};

const light: Palette = {
  // 背景とカードの差を小さくした静かな地（カンプ実測 #F5F7F9〜#F7FAFC）
  background: '#F6F8FB',
  heroBlobs: ['rgba(77, 132, 255, 0.20)', 'rgba(150, 120, 255, 0.20)', 'rgba(255, 120, 200, 0.16)'],
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF2F9',
  border: 'rgba(15, 23, 42, 0.05)',
  hairline: 'rgba(15, 23, 42, 0.1)',
  textPrimary: '#0F172A',
  // カンプより少し濃くして、背景・カードの上で WCAG AA（4.5:1）を満たす
  textSecondary: '#56667D',
  textTertiary: '#5F6E85',
  onAccent: '#FFFFFF',
  fill: 'rgba(15, 23, 42, 0.04)',
  skeletonHighlight: 'rgba(255, 255, 255, 0.7)',
  glass: 'rgba(255, 255, 255, 0.2)',
  scrim: ['rgba(11, 13, 30, 0.55)', 'rgba(11, 13, 30, 0.85)'],
  headerBase: '#1C2640',
  positive: '#10B981',
  negative: '#F43F5E',
  warning: '#F59E0B',
  info: '#4F7BFF',
  positiveSoft: 'rgba(16, 185, 129, 0.12)',
  negativeSoft: 'rgba(244, 63, 94, 0.10)',
  warningSoft: 'rgba(245, 158, 11, 0.12)',
  infoSoft: 'rgba(79, 123, 255, 0.10)',
  negativeText: '#CC1439',
  positiveText: '#047857',
  warningText: '#B45309',
  infoText: '#3D63E8',
};

const dark: Palette = {
  // 暗い地にネオンのアクセントが映えるよう、背景は青みのある黒
  background: '#07080F',
  heroBlobs: ['rgba(61, 123, 255, 0.24)', 'rgba(139, 92, 255, 0.24)', 'rgba(255, 92, 168, 0.14)'],
  surface: '#11131E',
  surfaceSecondary: '#1A1D2B',
  border: 'rgba(255, 255, 255, 0.07)',
  hairline: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#7C8AA0',
  onAccent: '#FFFFFF',
  fill: 'rgba(255, 255, 255, 0.05)',
  skeletonHighlight: 'rgba(255, 255, 255, 0.08)',
  glass: 'rgba(255, 255, 255, 0.14)',
  scrim: ['rgba(5, 6, 12, 0.55)', 'rgba(5, 6, 12, 0.9)'],
  headerBase: '#10142A',
  positive: '#34D399',
  negative: '#FB7185',
  warning: '#FBBF24',
  info: '#7397FF',
  positiveSoft: 'rgba(52, 211, 153, 0.16)',
  negativeSoft: 'rgba(251, 113, 133, 0.16)',
  warningSoft: 'rgba(251, 191, 36, 0.16)',
  infoSoft: 'rgba(115, 151, 255, 0.16)',
  negativeText: '#FB7185',
  positiveText: '#34D399',
  warningText: '#FBBF24',
  infoText: '#7397FF',
};

export const palettes: Record<ColorScheme, Palette> = { light, dark };

/** 発光（色付きの柔らかい影）。アクセント部品にだけ使う。文字・背景・カードには付けない */
function glow(rgb: string, alpha: number, blur = 20, y = 6): string {
  return `0 ${y}px ${blur}px rgba(${rgb}, ${alpha})`;
}

/**
 * アクセントカラー。面積を小さく使う（ボタン・選択状態・グラフ・バッジ）。
 * 「テーマカラーの切り替え」（プレミアム）用にプリセット化している。default はネオン寄り
 * （エレクトリックブルー→パープル。カンプより彩度を上げている）。
 */
export type Accent = {
  primary: string;
  secondary: string;
  tertiary: string;
  /** 主要ボタン・選択中セグメント・チップ・＋ボタン（約135°） */
  gradient: readonly [string, string];
  /** 「カスタムで追加する」の大ボタン（ピンク→ブルー→シアン）。文字は中央の濃い色の上に載る */
  gradientCta: readonly [string, string, string];
  /** グラフの非選択バー（上→下） */
  gradientMuted: readonly [string, string];
  /** gradient の部品に付ける発光 */
  glow: string;
  /** gradientCta の大ボタンに付ける色付きの影 */
  ctaGlow: string;
  /** Toggle のトラック等 */
  control: string;
  /** リンク等の文字色（AA 4.5:1 を満たす濃さ） */
  text: string;
};

export type AccentPresetId = 'default' | 'ocean' | 'sakura' | 'mint';

type AccentPreset = { label: string; light: Accent; dark: Accent };

export const accentPresets: Record<AccentPresetId, AccentPreset> = {
  default: {
    label: 'ネオンブルー',
    light: {
      primary: '#3D7BFF',
      secondary: '#8B5CFF',
      tertiary: '#22D3EE',
      gradient: ['#3D7BFF', '#8B5CFF'],
      gradientCta: ['#F26BDB', '#5468FF', '#22C8F0'],
      gradientMuted: ['#D3DDFF', '#BCD0FF'],
      glow: glow('92, 100, 255', 0.3),
      ctaGlow: glow('84, 104, 255', 0.3, 24, 8),
      control: '#3D7BFF',
      text: '#3D63E8',
    },
    dark: {
      primary: '#5B8CFF',
      secondary: '#A07BFF',
      tertiary: '#3BE0F5',
      gradient: ['#3D7BFF', '#8B5CFF'],
      gradientCta: ['#E05BD0', '#5468FF', '#1FB8E0'],
      gradientMuted: ['#262E52', '#2E3566'],
      glow: glow('110, 110, 255', 0.35, 22),
      ctaGlow: glow('90, 110, 255', 0.35, 24, 8),
      control: '#5B7CFF',
      text: '#7FA2FF',
    },
  },
  ocean: {
    label: 'オーシャン',
    light: {
      primary: '#0EA5E9',
      secondary: '#3B82F6',
      tertiary: '#22D3EE',
      gradient: ['#0EA5E9', '#3B6BF6'],
      gradientCta: ['#22D3EE', '#2B7BF0', '#6366F1'],
      gradientMuted: ['#CFEAFB', '#B9DDF7'],
      glow: glow('14, 165, 233', 0.28),
      ctaGlow: glow('43, 123, 240', 0.28, 24, 8),
      control: '#0EA5E9',
      text: '#0369A1',
    },
    dark: {
      primary: '#38BDF8',
      secondary: '#60A5FA',
      tertiary: '#4FE0F5',
      gradient: ['#0EA5E9', '#3B6BF6'],
      gradientCta: ['#1EB8D6', '#2B7BF0', '#5B5EE6'],
      gradientMuted: ['#173A52', '#1E335C'],
      glow: glow('56, 189, 248', 0.32, 22),
      ctaGlow: glow('43, 123, 240', 0.32, 24, 8),
      control: '#38BDF8',
      text: '#38BDF8',
    },
  },
  sakura: {
    label: 'サクラ',
    light: {
      primary: '#EC4899',
      secondary: '#A855F7',
      tertiary: '#F472B6',
      gradient: ['#EC4899', '#9F4BF7'],
      gradientCta: ['#FB7185', '#E0409A', '#9F4BF7'],
      gradientMuted: ['#FBD3E7', '#EBCBFA'],
      glow: glow('236, 72, 153', 0.28),
      ctaGlow: glow('224, 64, 154', 0.28, 24, 8),
      control: '#EC4899',
      text: '#BE185D',
    },
    dark: {
      primary: '#F472B6',
      secondary: '#C084FC',
      tertiary: '#F9A8D4',
      gradient: ['#E2408F', '#9F4BF7'],
      gradientCta: ['#E85A70', '#D0378E', '#8E40E6'],
      gradientMuted: ['#4A2038', '#3B2552'],
      glow: glow('244, 114, 182', 0.32, 22),
      ctaGlow: glow('224, 64, 154', 0.32, 24, 8),
      control: '#F472B6',
      text: '#F472B6',
    },
  },
  mint: {
    label: 'ミント',
    light: {
      primary: '#10B981',
      secondary: '#14B8A6',
      tertiary: '#22D3EE',
      gradient: ['#0EA371', '#0E94A8'],
      gradientCta: ['#34D399', '#0E9F8E', '#0EA5E9'],
      gradientMuted: ['#C9F2E3', '#B5E8EE'],
      glow: glow('16, 185, 129', 0.28),
      ctaGlow: glow('14, 159, 142', 0.28, 24, 8),
      control: '#10B981',
      text: '#047857',
    },
    dark: {
      primary: '#34D399',
      secondary: '#2DD4BF',
      tertiary: '#4FE0F5',
      gradient: ['#0EA371', '#0E94A8'],
      gradientCta: ['#22B985', '#0E9F8E', '#0B8FCC'],
      gradientMuted: ['#173F33', '#163E40'],
      glow: glow('52, 211, 153', 0.32, 22),
      ctaGlow: glow('14, 159, 142', 0.32, 24, 8),
      control: '#34D399',
      text: '#34D399',
    },
  },
};

/**
 * カテゴリカラー（グラフ・カテゴリタイル）。タイル背景はこの色の8〜12%不透明度。
 * ネオン寄りの発色（ブルー・ピンク・シアン・アンバー・コーラル・パープル）。
 * グラフでは各色から少し明るい色へのグラデーションで塗る（lighten）。
 */
export const categoryColors = {
  video_music: '#3D8BFF',
  productivity: '#FF4FA3',
  cloud: '#16CFE8',
  game: '#FFAE33',
  sns: '#FF7A59',
  other: '#9B5CFF',
} as const;

export type CategoryColorKey = keyof typeof categoryColors;

/** '#RRGGBB' に不透明度を付ける（カテゴリタイルの淡色背景など） */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}

/** '#RRGGBB' を白に寄せる（グラフの濃淡グラデーションの明るい側） */
export function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase()}`;
}

/** '#RRGGBB' を黒に寄せる（淡い色の面に載せる同系色の文字を読みやすくする） */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const mix = (c: number) => Math.round(c * (1 - amount));
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase()}`;
}

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  /** 画面の左右余白（カンプ実測 22〜24pt） */
  screen: 22,
} as const;

export const radius = {
  /** 大きいカード（カンプ実測 約22pt） */
  card: 22,
  /** 内部カード・タイル・リストのカード（設定など。カンプ実測 約15pt） */
  inner: 16,
  buttonLarge: 28,
  icon: 12,
  sm: 8,
  pill: 999,
} as const;

/** カードの影。背景との差を小さくし、広く柔らかく薄く */
export const shadows: Record<ColorScheme, string | undefined> = {
  light: '0 1px 2px rgba(15, 23, 42, 0.03), 0 8px 28px rgba(40, 56, 110, 0.06)',
  // ダークは影なし＋border で区切る
  dark: undefined,
};

/** モーション（イージング Easing.out(cubic) は ThemeProvider で付与する） */
export const motion = {
  duration: 220,
  durationSlow: 400,
  chartDuration: 600,
  barStagger: 30,
  pressScale: 0.97,
  spring: { damping: 18, stiffness: 260, mass: 1 },
} as const;

export const sizes = {
  touchTarget: 44,
  iconButton: 44,
  /** 一覧・ホームの行のサービスアイコン（カンプ実測 46pt） */
  serviceIcon: 46,
  serviceIconLarge: 72,
  buttonHeight: 56,
  buttonHeightSmall: 40,
  /** 検索欄（カンプ実測 約40pt） */
  searchHeight: 40,
  /** セグメント（カンプ実測 33〜36pt） */
  segmentHeight: 36,
  hairline: 0.5,
} as const;

/** 自作カテゴリ・カスタムサービスのアイコンに選べる色 */
export const customColorChoices = [
  '#3D8BFF',
  '#FF4FA3',
  '#16CFE8',
  '#FFAE33',
  '#FF7A59',
  '#9B5CFF',
  '#818CF8',
  '#10B981',
  '#64748B',
] as const;
