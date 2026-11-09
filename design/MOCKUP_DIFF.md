# カンプとの差分

カンプ（design/mockup.png）と意図して変えている箇所の記録。

## 「人気のサービス」の並び（サブスクを追加画面）

- 決定日：2026-11-09（ユーザーが案Aを選択）
- カンプ：Netflix／YouTube／Spotify／Amazon Prime／Google One／iCloud+／Microsoft 365／Adobe
- 実装：YouTube／Spotify／ChatGPT Plus／X Premium／Netflix／Amazon Prime／Google One／iCloud+
- 変えた点
  - 公式ロゴのある4件（YouTube・Spotify・ChatGPT Plus・X Premium）を先頭に置いた
  - カンプにない ChatGPT Plus と X Premium を追加した
  - カンプにある Microsoft 365 と Adobe をグリッドから外した（検索とカテゴリからは今までどおり選べる）
- 理由：ロゴのあるサービスを1行目にそろえて、グリッドの見た目をそろえるため。カンプの並びのままでは、ロゴがあるのは8件中2件だけになる
- 比較画像：design/compare/featured_order.png（「案A」の列）
- 実装箇所：src/data/popularServices.ts の FEATURED_KEYS
