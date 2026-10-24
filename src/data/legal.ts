/** よくある質問・プライバシーポリシー・利用規約・ライセンスの文面（アプリ内の静的ページ） */

export type Section = { heading: string; body: string };

export const faqItems: readonly Section[] = [
  {
    heading: '金額や更新日は自動で取得されますか？',
    body: 'いいえ。サブスクBoxは各サービスと連携しておらず、金額・更新日・利用状況はすべてご自身で入力した内容をもとに表示しています。表示される金額や支払い履歴は目安です。実際の請求額は各サービスの明細でご確認ください。',
  },
  {
    heading: '支払い履歴はどのように作られますか？',
    body: '登録内容（契約開始日・支払い周期・料金）から請求日を計算して自動で記録しています。実際と違う場合は、支払い履歴の画面から金額・日付を修正、または削除できます。修正した行は自動では上書きされません。',
  },
  {
    heading: '通知が届きません',
    body: '設定 → 通知設定 で「更新前に通知する」がオンになっているか、iPhoneの「設定」→「通知」→「サブスクBox」で通知が許可されているかをご確認ください。通知は近い順に最大50件まで予約し、アプリを開くたびに入れ替えます。',
  },
  {
    heading: 'データはどこに保存されますか？',
    body: 'すべてのデータはこのiPhoneの中だけに保存され、外部のサーバーには送信しません。iPhoneのiCloudバックアップを有効にしている場合は、アプリのデータもバックアップに含まれます。',
  },
  {
    heading: '機種変更のときはどうすればよいですか？',
    body: 'iCloudバックアップから新しいiPhoneを復元すると、データも引き継がれます。念のため、設定 → データのバックアップ →「データを書き出す」でファイルを保存し、新しいiPhoneで「バックアップから復元」することもおすすめします。なお、書き出したファイルにはアイコンに設定した写真は含まれません（復元後はロゴまたは頭文字のアイコンになります）。',
  },
  {
    heading: '外貨のサブスクはどう合計されますか？',
    body: '設定 → データのバックアップ → 外貨の為替レート で入力したレートで円に換算して合計します。為替レートは自動では取得しません。レートを入力していない通貨は合計に含まれません。',
  },
];

/** 制定日・最終改定日（規約・ポリシーを変えたら更新する） */
export const LEGAL_UPDATED_AT = '2026年10月24日';

export const privacyPolicy: readonly Section[] = [
  {
    heading: 'はじめに',
    body: 'サブスクBox（以下「本アプリ」）は、利用者の情報を次のとおり取り扱います。本アプリにはアカウント登録の機能はありません。',
  },
  {
    heading: '利用者が入力する情報',
    body: 'サブスクリプションの名称・金額・更新日・メモ・支払い方法（カード番号は下4桁のみ）・アイコンの写真などの入力内容は、利用者の端末内にのみ保存します。これらの情報を開発者や第三者のサーバーに送信することはありません。写真ライブラリへのアクセスは、利用者がアイコンの写真を選ぶときだけ行います。',
  },
  {
    heading: '広告（無料版）',
    body: '無料版では、Google LLC が提供する広告配信サービス「Google AdMob」を利用して広告を表示します。AdMob は広告の配信・効果測定・不正防止のために、端末やアプリに関する情報（IPアドレス、端末の種類、OSのバージョン、おおよその位置情報、広告の表示やタップに関する情報など）を収集する場合があります。本アプリはトラッキングの許可を求めず、利用者の興味・関心に基づかない広告（非パーソナライズ広告）のみを表示します。一部の地域では、法令に基づき広告に関する同意を確認する画面を表示します。Google によるデータの取り扱いは、Google のプライバシーポリシー（https://policies.google.com/privacy）およびパートナーのサイトやアプリでのデータ利用（https://policies.google.com/technologies/partner-sites）をご確認ください。プレミアムプランでは広告を表示せず、広告用のSDKも動作しません。',
  },
  {
    heading: 'アプリ内課金',
    body: 'プレミアムプランの購入・復元の処理には、Apple の App Store と、RevenueCat, Inc. が提供する課金管理サービス「RevenueCat」を利用します。RevenueCat は購入状態の確認のために、購入履歴と、端末ごとに発行される匿名の識別子を取り扱います。氏名・メールアドレス・お支払い方法などの情報を開発者が受け取ることはありません。詳しくは RevenueCat のプライバシーポリシー（https://www.revenuecat.com/privacy）をご確認ください。',
  },
  {
    heading: '通知',
    body: '更新日の通知は、端末内で予約するローカル通知です。通知のために外部と通信することはありません。',
  },
  {
    heading: '第三者への提供',
    body: '上記の広告・アプリ内課金のサービスを除き、利用者の情報を第三者に提供することはありません。',
  },
  {
    heading: 'データの削除',
    body: '設定 → データのバックアップ →「すべてのデータを削除」から、本アプリに保存したデータをいつでも削除できます。アプリを削除した場合も、端末内のデータは削除されます。',
  },
  {
    heading: 'お問い合わせ',
    body: '本ポリシーに関するお問い合わせは、yuon.hirose.info@gmail.com までご連絡ください。',
  },
  {
    heading: '改定',
    body: '本ポリシーを改定する場合は、本ページおよびアプリのアップデートでお知らせします。',
  },
];

export const termsOfUse: readonly Section[] = [
  {
    heading: '本アプリについて',
    body: 'サブスクBox（以下「本アプリ」）は、利用者が自身のサブスクリプションを手動で記録・管理するためのツールです。本アプリは各サービスの提供者とは関係がなく、各サービスと連携していません。',
  },
  {
    heading: '表示内容',
    body: '本アプリに表示される金額・更新日・支払い履歴・分析結果・見直し候補は、利用者が入力した情報に基づく目安です。正確性を保証するものではありません。実際の契約内容・請求額は各サービスでご確認ください。',
  },
  {
    heading: 'プレミアムプラン',
    body: 'プレミアムプランは買い切り（1回のみのお支払い）の商品で、自動更新や定期的な請求はありません。代金は購入の確定時に Apple ID に請求されます。購入は同じ Apple ID の端末で「購入を復元」から利用できます。返金については Apple の定める手続きに従います。',
  },
  {
    heading: '広告',
    body: '無料版では広告を表示します。広告の内容は広告主の責任によるもので、開発者は広告先の商品・サービスについて責任を負いません。',
  },
  {
    heading: 'データの管理',
    body: 'データは利用者の端末内に保存されます。端末の故障・紛失などに備え、定期的なバックアップをおすすめします。データの消失について、開発者は責任を負いかねます。',
  },
  {
    heading: '禁止事項',
    body: '本アプリの改ざん・リバースエンジニアリング、その他法令に反する利用を禁止します。',
  },
  {
    heading: '変更',
    body: '本規約は、本ページおよびアプリのアップデートにより変更する場合があります。',
  },
];

/** 主なオープンソースソフトウェア */
export const licenses: readonly { name: string; license: string }[] = [
  { name: 'React', license: 'MIT License' },
  { name: 'React Native', license: 'MIT License' },
  { name: 'Expo（expo-router、expo-sqlite、expo-notifications ほか）', license: 'MIT License' },
  { name: 'React Native Reanimated', license: 'MIT License' },
  { name: 'React Native Gesture Handler', license: 'MIT License' },
  { name: 'React Native SVG', license: 'MIT License' },
  { name: 'React Native Screens', license: 'MIT License' },
  { name: 'React Native Safe Area Context', license: 'MIT License' },
  { name: 'Zustand', license: 'MIT License' },
  { name: 'date-fns', license: 'MIT License' },
  { name: 'React Native Purchases（RevenueCat）', license: 'MIT License' },
  { name: 'React Native Google Mobile Ads', license: 'Apache License 2.0' },
];
