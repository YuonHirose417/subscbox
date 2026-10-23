import { Easing } from 'react-native-reanimated';

/**
 * デザイントークン。色・余白・角丸・影・モーションの値はすべてここで定義し、
 * コンポーネントは useTheme() 経由で参照する（ここ以外で色リテラルを書かない）。
 * 初期値は仕様書4章とデザインカンプ（design/mockup.png）から読み取ったもの。
 */

export type ColorScheme = 'light' | 'dark';

export type Palette = {
  background: string;
  /** 画面上部のごく薄いラベンダー〜ピンク（ホーム上部）。上→下で background に溶ける */
  backgroundTint: readonly [string, string, string];
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
  positive: string;
  negative: string;
  warning: string;
  info: string;
  positiveSoft: string;
  negativeSoft: string;
  warningSoft: string;
  infoSoft: string;
};

const light: Palette = {
  background: '#F5F6FA',
  backgroundTint: ['#ECEBFF', '#F7EEFB', '#F5F6FA'],
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F2F7',
  border: 'rgba(15, 23, 42, 0.06)',
  hairline: 'rgba(15, 23, 42, 0.08)',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  onAccent: '#FFFFFF',
  fill: 'rgba(15, 23, 42, 0.04)',
  skeletonHighlight: 'rgba(255, 255, 255, 0.7)',
  glass: 'rgba(255, 255, 255, 0.2)',
  scrim: ['rgba(11, 13, 30, 0.55)', 'rgba(11, 13, 30, 0.85)'],
  positive: '#10B981',
  negative: '#F43F5E',
  warning: '#F59E0B',
  info: '#4F7BFF',
  positiveSoft: 'rgba(16, 185, 129, 0.12)',
  negativeSoft: 'rgba(244, 63, 94, 0.10)',
  warningSoft: 'rgba(245, 158, 11, 0.12)',
  infoSoft: 'rgba(79, 123, 255, 0.10)',
};

const dark: Palette = {
  background: '#0B0D14',
  backgroundTint: ['#171830', '#140F22', '#0B0D14'],
  surface: '#151823',
  surfaceSecondary: '#1D2130',
  border: 'rgba(255, 255, 255, 0.06)',
  hairline: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#7C8AA0',
  onAccent: '#FFFFFF',
  fill: 'rgba(255, 255, 255, 0.05)',
  skeletonHighlight: 'rgba(255, 255, 255, 0.08)',
  glass: 'rgba(255, 255, 255, 0.14)',
  scrim: ['rgba(5, 6, 12, 0.55)', 'rgba(5, 6, 12, 0.9)'],
  positive: '#34D399',
  negative: '#FB7185',
  warning: '#FBBF24',
  info: '#7397FF',
  positiveSoft: 'rgba(52, 211, 153, 0.16)',
  negativeSoft: 'rgba(251, 113, 133, 0.16)',
  warningSoft: 'rgba(251, 191, 36, 0.16)',
  infoSoft: 'rgba(115, 151, 255, 0.16)',
};

export const palettes: Record<ColorScheme, Palette> = { light, dark };

/**
 * アクセントカラー。面積を小さく使う（ボタン・選択状態・グラフ・バッジ）。
 * 「テーマカラーの切り替え」（プレミアム）用にプリセット化している。default がカンプの配色。
 */
export type Accent = {
  primary: string;
  secondary: string;
  tertiary: string;
  /** 主要ボタン・選択中セグメント（約135°） */
  gradient: readonly [string, string];
  /** 「カスタムで追加する」等の大ボタン（淡いグラデーション） */
  gradientSoft: readonly [string, string];
  /** グラフの非選択バー等 */
  gradientMuted: readonly [string, string];
  /** Toggle のトラック等 */
  control: string;
};

export type AccentPresetId = 'default' | 'ocean' | 'sakura' | 'mint';

type AccentPreset = { label: string; light: Accent; dark: Accent };

export const accentPresets: Record<AccentPresetId, AccentPreset> = {
  default: {
    label: 'ネオンブルー',
    light: {
      primary: '#4F7BFF',
      secondary: '#8B5CF6',
      tertiary: '#22D3EE',
      gradient: ['#5E8BFF', '#8B7CFF'],
      gradientSoft: ['#C4A5FB', '#93C5FD'],
      gradientMuted: ['#C7D6FF', '#DCD4FF'],
      control: '#4F7BFF',
    },
    dark: {
      primary: '#7397FF',
      secondary: '#A78BFA',
      tertiary: '#4FE0F5',
      gradient: ['#6E97FF', '#9B8CFF'],
      gradientSoft: ['#9F86E8', '#6FA3E8'],
      gradientMuted: ['#2C3866', '#3A3270'],
      control: '#6E8FFF',
    },
  },
  ocean: {
    label: 'オーシャン',
    light: {
      primary: '#0EA5E9',
      secondary: '#3B82F6',
      tertiary: '#22D3EE',
      gradient: ['#22B5F0', '#3B82F6'],
      gradientSoft: ['#A5E3FB', '#A5C8FD'],
      gradientMuted: ['#C5E9FA', '#CFE0FD'],
      control: '#0EA5E9',
    },
    dark: {
      primary: '#38BDF8',
      secondary: '#60A5FA',
      tertiary: '#4FE0F5',
      gradient: ['#38BDF8', '#60A5FA'],
      gradientSoft: ['#4C9AC2', '#5B86C9'],
      gradientMuted: ['#173A52', '#1E335C'],
      control: '#38BDF8',
    },
  },
  sakura: {
    label: 'サクラ',
    light: {
      primary: '#EC4899',
      secondary: '#A855F7',
      tertiary: '#F472B6',
      gradient: ['#F15FA6', '#B46BF8'],
      gradientSoft: ['#F9B8D9', '#D6B4FB'],
      gradientMuted: ['#FBD3E7', '#E6D3FC'],
      control: '#EC4899',
    },
    dark: {
      primary: '#F472B6',
      secondary: '#C084FC',
      tertiary: '#F9A8D4',
      gradient: ['#F472B6', '#C084FC'],
      gradientSoft: ['#B66A93', '#9670C2'],
      gradientMuted: ['#4A2038', '#3B2552'],
      control: '#F472B6',
    },
  },
  mint: {
    label: 'ミント',
    light: {
      primary: '#10B981',
      secondary: '#14B8A6',
      tertiary: '#22D3EE',
      gradient: ['#20C08D', '#14A8B8'],
      gradientSoft: ['#A7EBD3', '#A5E4EE'],
      gradientMuted: ['#C9F2E3', '#C8EEF2'],
      control: '#10B981',
    },
    dark: {
      primary: '#34D399',
      secondary: '#2DD4BF',
      tertiary: '#4FE0F5',
      gradient: ['#34D399', '#2DD4BF'],
      gradientSoft: ['#3E9C7C', '#3A9BA6'],
      gradientMuted: ['#173F33', '#163E40'],
      control: '#34D399',
    },
  },
};

/**
 * カテゴリカラー（グラフ・カテゴリタイル）。タイル背景はこの色の8〜10%不透明度。
 * ホームのドーナツ（カンプ）から採色。SNS はカンプのドーナツに無いため他と区別できる藍色にした。
 */
export const categoryColors = {
  video_music: '#59A6FD',
  productivity: '#FC86A9',
  cloud: '#5FE2D1',
  game: '#FECA68',
  sns: '#818CF8',
  other: '#AF7CF8',
} as const;

export type CategoryColorKey = keyof typeof categoryColors;

/** '#RRGGBB' に不透明度を付ける（カテゴリタイルの淡色背景など） */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
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
  /** 画面の左右余白 */
  screen: 20,
} as const;

export const radius = {
  card: 20,
  inner: 16,
  buttonLarge: 28,
  icon: 12,
  sm: 8,
  pill: 999,
} as const;

export const shadows: Record<ColorScheme, string | undefined> = {
  light: '0 4px 20px rgba(15, 23, 42, 0.05)',
  // ダークは影なし＋border で区切る
  dark: undefined,
};

/** 主要ボタン用のごく薄い色付き影（1層まで） */
export const accentShadow: Record<ColorScheme, string | undefined> = {
  light: '0 6px 16px rgba(94, 139, 255, 0.22)',
  dark: undefined,
};

export const motion = {
  duration: 220,
  durationSlow: 400,
  chartDuration: 600,
  barStagger: 30,
  easing: Easing.out(Easing.cubic),
  pressScale: 0.97,
  spring: { damping: 18, stiffness: 260, mass: 1 },
} as const;

export const sizes = {
  touchTarget: 44,
  iconButton: 44,
  serviceIcon: 44,
  serviceIconLarge: 72,
  buttonHeight: 56,
  buttonHeightSmall: 40,
  hairline: 0.5,
} as const;
