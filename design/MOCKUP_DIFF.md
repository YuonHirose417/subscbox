# カンプとの差分

カンプ（design/mockup.png）と意図して変えている箇所の記録。

## 「人気のサービス」の並び（サブスクを追加画面）

- 決定日：2026-11-09（ユーザーが案Aを選択）
- カンプ：Netflix／YouTube／Spotify／Amazon Prime／Google One／iCloud+／Microsoft 365／Adobe
- 実装：YouTube／Spotify／ChatGPT／X Premium／Netflix／Amazon Prime／Google One／iCloud+
- 変えた点
  - 公式ロゴのある4件（YouTube・Spotify・ChatGPT・X Premium）を先頭に置いた
  - カンプにない ChatGPT と X Premium を追加した
  - カンプにある Microsoft 365 と Adobe をグリッドから外した（検索とカテゴリからは今までどおり選べる）
- 理由：ロゴのあるサービスを1行目にそろえて、グリッドの見た目をそろえるため。カンプの並びのままでは、ロゴがあるのは8件中2件だけになる
- 比較画像：design/compare/featured_order.png（「案A」の列）
- 実装箇所：src/data/popularServices.ts の FEATURED_KEYS

## URL・メモの機能をなくした（追加・編集・詳細画面）

- 決定日：2026-11-10（ユーザーの指示）
- カンプ：詳細画面に「メモ」の行と「サービスを開く」の行がある。追加・編集画面に URL とメモの入力欄がある
- 実装：
  - 追加・編集画面から「URL」と「メモ」の入力欄を消した
  - 人気サービスの URL の自動入力をやめた（プリセットから URL を削除）
  - 詳細画面の「メモ」の行と「サービスを開く」の行を消した
  - CSV エクスポートから「URL」「メモ」の列を消した
  - プライバシーポリシーの「入力内容」の例から「メモ」を外した（改定日 2026年11月10日）
- 変えていないもの：
  - DB の列（url・memo）とバックアップの形式。列は残して使わないだけで、マイグレーションはしていない
  - 古いバックアップに URL・メモが入っていても、中身を検証せずにそのまま復元する
  - 編集して保存しても、すでに入っている URL・メモの値は消さずに残す
  - 新しく追加するサブスクは URL・メモを空で保存する
- 実装箇所：src/features/subscriptions/form/（SubscriptionForm.tsx・formValues.ts）、src/app/subscription/[id]/index.tsx、src/domain/validation.ts・csv.ts、src/data/popularServices.ts

## 「ChatGPT Plus」を「ChatGPT」にした（人気のサービス）

- 決定日：2026-11-10（ユーザーの指示）
- カンプ：ChatGPT はカンプにない（「人気のサービス」の並びの差分で追加したもの）。追加時の表示名は「ChatGPT Plus」だった
- 実装：
  - 表示名を「ChatGPT」にした（グリッド・検索・追加フォームの初期値など、プリセットの名前が出るすべての場所）
  - プラン名は決めない。プランの候補を出さず、入力欄は空のままにする
  - 金額は Plus の参考価格（20 USD／月）を初期値にする。「参考価格（目安）です」の注記はそのまま出す
- 変えていないもの：serviceKey（chatgpt）とロゴ（assets/service-logos/chatgpt.png）。すでに「ChatGPT Plus」の名前で登録したサブスクは、ユーザーのデータなので書き換えない
- 実装箇所：src/data/popularServices.ts（chatgpt）、SubscriptionForm.tsx（名前が空のプランは候補に出さない）
