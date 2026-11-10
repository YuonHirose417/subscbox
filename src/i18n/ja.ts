/** 画面に出す文言を集約する（将来の多言語化に備える） */
export const ja = {
  appName: 'SubscBox',
  common: {
    seeAll: 'すべて見る',
    retry: '再試行',
    back: '戻る',
    close: '閉じる',
    more: 'その他の操作',
    clear: '条件をクリア',
  },
  screens: {
    home: { titleLine1: '今月の', titleLine2: 'サブスク支出' },
    subscriptions: { title: 'サブスク一覧', searchPlaceholder: 'サービス名、カテゴリで検索' },
    analytics: { title: '支出の分析' },
    settings: { title: '設定' },
    catalog: { title: 'デザインカタログ' },
  },
  period: { month: '月', year: '年', all: '全期間' },
  empty: {
    homeTitle: 'まだサブスクが登録されていません',
    homeBody: '契約中のサービスを追加して、毎月の支出を把握しましょう',
    homeAction: 'サブスクを追加',
    searchTitle: '該当するサブスクがありません',
    analyticsTitle: 'データが集まると、ここに支出の推移が表示されます',
  },
  error: {
    loadTitle: 'データを読み込めませんでした',
  },
  settings: {
    notifications: '通知設定',
    backup: 'データのバックアップ',
    theme: 'テーマ',
    premium: 'プレミアムプラン',
    faq: 'よくある質問',
    contact: 'お問い合わせ',
    themeValues: { system: 'システム', light: 'ライト', dark: 'ダーク' },
    devCatalog: 'デザインカタログ（開発用）',
  },
} as const;
