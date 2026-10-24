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
    body: 'iCloudバックアップから新しいiPhoneを復元すると、データも引き継がれます。念のため、設定 → データのバックアップ →「データを書き出す」でファイルを保存し、新しいiPhoneで「バックアップから復元」することもおすすめします。',
  },
  {
    heading: '外貨のサブスクはどう合計されますか？',
    body: '設定 → データのバックアップ → 外貨の為替レート で入力したレートで円に換算して合計します。為替レートは自動では取得しません。レートを入力していない通貨は合計に含まれません。',
  },
];

export const privacyPolicy: readonly Section[] = [
  {
    heading: '取得する情報',
    body: 'サブスクBox（以下「本アプリ」）は、ユーザーが入力したサブスクリプションの情報（サービス名、金額、更新日、メモなど）を端末内にのみ保存します。氏名・メールアドレス・位置情報などの個人情報は取得しません。アカウント登録はありません。',
  },
  {
    heading: '外部への送信',
    body: '本アプリは入力されたデータを外部のサーバーに送信しません。アプリ内課金の処理のため、購入状態の確認に限り決済サービス（Apple および課金管理サービス）と通信する場合があります。',
  },
  {
    heading: 'トラッキング',
    body: '本アプリは、ユーザーを他社のアプリやウェブサイトをまたいで追跡しません。',
  },
  {
    heading: 'データの削除',
    body: '設定 → データのバックアップ →「すべてのデータを削除」から、本アプリに保存したデータをいつでも削除できます。アプリを削除した場合も端末内のデータは削除されます。',
  },
  {
    heading: '改定',
    body: '本ポリシーを改定する場合は、本アプリのアップデートでお知らせします。',
  },
];

export const termsOfUse: readonly Section[] = [
  {
    heading: '本アプリについて',
    body: '本アプリは、ユーザーが自身のサブスクリプションを手動で記録・管理するためのツールです。各サービスの提供者とは関係ありません。',
  },
  {
    heading: '表示内容',
    body: '本アプリに表示される金額・更新日・支払い履歴・分析結果は、ユーザーが入力した情報に基づく目安です。正確性を保証するものではありません。実際の契約内容・請求額は各サービスでご確認ください。',
  },
  {
    heading: 'データの管理',
    body: 'データは端末内に保存されます。端末の故障・紛失などに備え、定期的なバックアップをおすすめします。データの消失について、開発者は責任を負いかねます。',
  },
  {
    heading: '禁止事項',
    body: '本アプリの改ざん・リバースエンジニアリング、その他法令に反する利用を禁止します。',
  },
  {
    heading: '変更',
    body: '本規約はアップデートにより変更する場合があります。',
  },
];

/** 主なオープンソースソフトウェア（すべて MIT License） */
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
];
