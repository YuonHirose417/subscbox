import type { BillingCycle, CurrencyCode, DefaultCategoryId } from '@/domain/types';

export type ServicePlanPreset = {
  name: string;
  /** 参考価格（目安）。フォームの初期値にするだけで、実際の金額はユーザーが確認・修正する */
  amountMinor: number;
  currency: CurrencyCode;
  cycle: BillingCycle;
};

export type ServicePreset = {
  key: string;
  name: string;
  /** 「人気のサービス」グリッドの短い表示名（カンプ：YouTube、Adobe） */
  shortName?: string;
  categoryId: DefaultCategoryId;
  /** ロゴ未配置時の頭文字アイコンの背景色 */
  brandColor: string;
  monogram: string;
  /** 検索用の別名（カタカナ表記など） */
  aliases?: string[];
  url?: string;
  plans: ServicePlanPreset[];
};

const monthly: BillingCycle = { unit: 'month', interval: 1 };
const yearly: BillingCycle = { unit: 'year', interval: 1 };
const jpy = (amountMinor: number, cycle: BillingCycle = monthly) =>
  ({ amountMinor, currency: 'JPY', cycle }) as const;

/**
 * 人気サービスのプリセット。「人気のサービス」グリッドの8件は下の featuredServices で決める。
 * 価格は参考値（目安）で、改定される可能性がある。
 */
export const popularServices: readonly ServicePreset[] = [
  {
    key: 'netflix',
    name: 'Netflix',
    categoryId: 'video_music',
    brandColor: '#E50914',
    monogram: 'N',
    aliases: ['ネットフリックス'],
    url: 'https://www.netflix.com/',
    plans: [
      { name: '広告つきスタンダード', ...jpy(890) },
      { name: 'スタンダードプラン', ...jpy(1590) },
      { name: 'プレミアム', ...jpy(2290) },
    ],
  },
  {
    key: 'youtube',
    name: 'YouTube Premium',
    shortName: 'YouTube',
    categoryId: 'video_music',
    brandColor: '#FF0033',
    monogram: 'Y',
    aliases: ['ユーチューブ', 'YouTube'],
    url: 'https://www.youtube.com/premium',
    plans: [
      { name: '個人プラン', ...jpy(1280) },
      { name: 'ファミリープラン', ...jpy(2280) },
    ],
  },
  {
    key: 'spotify',
    name: 'Spotify',
    categoryId: 'video_music',
    brandColor: '#1DB954',
    monogram: 'S',
    aliases: ['スポティファイ'],
    url: 'https://open.spotify.com/',
    plans: [
      { name: 'Premiumプラン', ...jpy(980) },
      { name: 'Premium Duo', ...jpy(1280) },
      { name: 'Premium Family', ...jpy(1580) },
    ],
  },
  {
    key: 'amazon_prime',
    name: 'Amazon Prime',
    categoryId: 'video_music',
    brandColor: '#00A8E1',
    monogram: 'a',
    aliases: ['アマゾンプライム', 'プライムビデオ'],
    url: 'https://www.amazon.co.jp/prime',
    plans: [
      { name: '月間プラン', ...jpy(600) },
      { name: '年間プラン', ...jpy(5900, yearly) },
    ],
  },
  {
    key: 'google_one',
    name: 'Google One',
    categoryId: 'cloud',
    brandColor: '#4285F4',
    monogram: 'G',
    aliases: ['グーグルワン'],
    url: 'https://one.google.com/',
    plans: [
      { name: 'ベーシック（100GB）', ...jpy(250) },
      { name: 'プレミアム（2TB）', ...jpy(1300) },
    ],
  },
  {
    key: 'icloud',
    name: 'iCloud+',
    categoryId: 'cloud',
    brandColor: '#3693F3',
    monogram: 'i',
    aliases: ['アイクラウド', 'iCloud'],
    plans: [
      { name: '50GBプラン', ...jpy(150) },
      { name: '200GBプラン', ...jpy(450) },
      { name: '2TBプラン', ...jpy(1500) },
    ],
  },
  {
    key: 'microsoft365',
    name: 'Microsoft 365',
    categoryId: 'productivity',
    brandColor: '#EA3E23',
    monogram: 'M',
    aliases: ['マイクロソフト', 'オフィス', 'Office'],
    url: 'https://www.microsoft365.com/',
    plans: [
      { name: 'Personal', ...jpy(2130) },
      { name: 'Personal（年額）', ...jpy(21300, yearly) },
    ],
  },
  {
    key: 'adobe',
    name: 'Adobe Creative Cloud',
    shortName: 'Adobe',
    categoryId: 'productivity',
    brandColor: '#FA0F00',
    monogram: 'A',
    aliases: ['アドビ', 'Adobe'],
    url: 'https://www.adobe.com/jp/creativecloud.html',
    plans: [
      { name: 'フォトプラン', ...jpy(1180) },
      { name: 'コンプリートプラン', ...jpy(7780) },
    ],
  },
  {
    key: 'apple_music',
    name: 'Apple Music',
    categoryId: 'video_music',
    brandColor: '#FA2D48',
    monogram: '♪',
    aliases: ['アップルミュージック'],
    plans: [{ name: '個人', ...jpy(1080) }],
  },
  {
    key: 'apple_tv',
    name: 'Apple TV+',
    categoryId: 'video_music',
    brandColor: '#1C1C1E',
    monogram: 'tv',
    aliases: ['アップルティーヴィー'],
    plans: [{ name: '月額', ...jpy(900) }],
  },
  {
    key: 'disney_plus',
    name: 'Disney+',
    categoryId: 'video_music',
    brandColor: '#113CCF',
    monogram: 'D',
    aliases: ['ディズニープラス'],
    url: 'https://www.disneyplus.com/',
    plans: [
      { name: 'スタンダード', ...jpy(1140) },
      { name: 'プレミアム', ...jpy(1520) },
    ],
  },
  {
    key: 'unext',
    name: 'U-NEXT',
    categoryId: 'video_music',
    brandColor: '#111111',
    monogram: 'U',
    aliases: ['ユーネクスト'],
    url: 'https://video.unext.jp/',
    plans: [{ name: '月額プラン', ...jpy(2189) }],
  },
  {
    key: 'abema',
    name: 'ABEMAプレミアム',
    categoryId: 'video_music',
    brandColor: '#1F1F1F',
    monogram: 'A',
    aliases: ['アベマ', 'ABEMA'],
    plans: [{ name: '月額', ...jpy(960) }],
  },
  {
    key: 'dazn',
    name: 'DAZN',
    categoryId: 'video_music',
    brandColor: '#0C161C',
    monogram: 'D',
    aliases: ['ダゾーン'],
    plans: [{ name: 'DAZN Standard', ...jpy(4200) }],
  },
  {
    key: 'chatgpt',
    name: 'ChatGPT Plus',
    categoryId: 'productivity',
    brandColor: '#10A37F',
    monogram: 'C',
    aliases: ['チャットGPT', 'OpenAI'],
    plans: [{ name: 'Plus', amountMinor: 2000, currency: 'USD', cycle: monthly }],
  },
  {
    key: 'notion',
    name: 'Notion',
    categoryId: 'productivity',
    brandColor: '#191919',
    monogram: 'N',
    aliases: ['ノーション'],
    plans: [{ name: 'Plus', amountMinor: 1200, currency: 'USD', cycle: monthly }],
  },
  {
    key: 'dropbox',
    name: 'Dropbox',
    categoryId: 'cloud',
    brandColor: '#0061FF',
    monogram: 'D',
    aliases: ['ドロップボックス'],
    plans: [{ name: 'Plus', ...jpy(1500) }],
  },
  {
    key: 'nintendo_switch_online',
    name: 'Nintendo Switch Online',
    categoryId: 'game',
    brandColor: '#E60012',
    monogram: 'N',
    aliases: ['ニンテンドー', '任天堂'],
    plans: [
      { name: '個人プラン（12か月）', ...jpy(2400, yearly) },
      { name: '個人プラン（1か月）', ...jpy(306) },
    ],
  },
  {
    key: 'playstation_plus',
    name: 'PlayStation Plus',
    categoryId: 'game',
    brandColor: '#0070D1',
    monogram: 'P',
    aliases: ['プレイステーション', 'PS Plus'],
    plans: [{ name: 'エッセンシャル', ...jpy(850) }],
  },
  {
    key: 'x_premium',
    name: 'X Premium',
    categoryId: 'sns',
    brandColor: '#000000',
    monogram: 'X',
    aliases: ['エックス', 'Twitter', 'ツイッター'],
    plans: [{ name: 'プレミアム', ...jpy(980) }],
  },
  {
    key: 'line_music',
    name: 'LINE MUSIC',
    categoryId: 'video_music',
    brandColor: '#06C755',
    monogram: 'L',
    aliases: ['ラインミュージック'],
    plans: [{ name: '一般プラン', ...jpy(1080) }],
  },
];

export const popularServicesByKey: Readonly<Record<string, ServicePreset>> = Object.fromEntries(
  popularServices.map((s) => [s.key, s]),
);

/**
 * 「人気のサービス」グリッドに出す8件。公式ロゴのあるサービスを先頭にしている
 * （カンプとの差分。design/MOCKUP_DIFF.md を参照）
 */
const FEATURED_KEYS = [
  'youtube',
  'spotify',
  'chatgpt',
  'x_premium',
  'netflix',
  'amazon_prime',
  'google_one',
  'icloud',
] as const;

export const featuredServices: readonly ServicePreset[] = FEATURED_KEYS.map(
  (key) => popularServicesByKey[key],
);
