# App Store のヘッダ・検索結果の画像（クリエイティブアセット）メモ

2026-11-12 に Apple の公式ページと公式テンプレートで確かめた内容です。**今回の申請では作らない**（任意のため）。公開後に必要になったら、このメモから作る。

## 前提

- 任意の素材で、スクリーンショット・App プレビューとは別に審査される（バージョンの更新なしで、Asset Library から単独で審査に出せる）
- 表示されるのは **iOS 27・iPadOS 27 以降** の App Store
- 1枚の **ユニバーサル素材（16:9）** を、ヘッダと検索結果の両方に使える。使わない場合は、それぞれ専用の素材を選ぶ
- 検索結果の素材を設定しない場合は、App 内イベント・App プレビュー・スクリーンショットが表示される
- 登録する場所：App Store Connect → アプリ → バージョン → 製品ページの情報 →「Header and Search Results」タブ（または Asset Library）。登録後は **プレビュー** で iPhone・iPad・向きごとの見え方を確認できる

## 仕様

| 置き場所 | 比率 | サイズ | 形式 |
|---|---|---|---|
| ヘッダ | 21:9 | 3840×1646 | jpeg・jpg・png |
| ヘッダ | 16:9 | 5244×2950 | png |
| 検索結果 | 3:2 | 最小 1920×1280〜最大 3840×2560 | jpeg・jpg・png |
| 検索結果 | 16:9 | 5244×2950 | png |

- 画像は **アルファチャンネル・透過を含めない**
- 動画も使える：5〜30秒、30fps または 60fps、mov・m4v・mp4。消音で始まり、ループ再生される（検索結果では音を出せない）

## セーフエリア（切れない範囲）

文章のページには具体的な数字がない（「大事なものはセーフエリアに入れ、焦点は中央に置く」とだけ書かれている）。下の数字は、Apple の公式 Photoshop テンプレートに入っている「Art Safe Area」の位置から読み取ったもの。

| 画像 | セーフエリア（px） | 大きさ（全体に対する割合） | 位置 |
|---|---|---|---|
| ヘッダ 3840×1646 | x 1097〜2743、y 493〜1154 | 1646×661（幅 43%・高さ 40%） | 中央 |
| 検索結果 3840×2560 | x 836〜3004、y 765〜1795 | 2168×1030（幅 56%・高さ 40%） | 中央 |
| ユニバーサル 5244×2950 | x 1921〜3323、y 660〜1622 | 1402×962（幅 27%・高さ 33%） | 横は中央、縦は上寄り（上の余白 660px、下の余白 1328px） |

- セーフエリアの外は、端末や画面の向きによって **切れる可能性がある**。外には背景や飾りだけを置く
- アイコン・アプリ名・「入手」ボタンなどが画像の上に重なるかどうかは、公式の文章にもテンプレートにも書かれていない。App Store Connect のプレビューで確かめる

公式テンプレートのダウンロード：

| 内容 | URL |
|---|---|
| Photoshop・ヘッダ | `https://developer.apple.com/go/?id=photoshop-product-page-header-template` |
| Photoshop・検索結果 | `https://developer.apple.com/go/?id=photoshop-search-results-template` |
| Photoshop・ユニバーサル | `https://developer.apple.com/go/?id=photoshop-universal-asset-template` |
| Figma・Sketch・Pixelmator | Asset Best Practices のページにリンクがある |

## 禁止されていること

- 具体的な価格・割引・Web サイトの URL・著作権記号（©）
- 確かめられない主張（受けていない賞や評価など）
- 他のプラットフォームやストアのロゴ、それらへの言及
- Apple の表彰（Editor's Choice・App of the Day・Game of the Day・Apple Design Award など）
- 不適切な内容（全年齢向けであること）、誤解させる目的で他のアプリに触れること
- アプリの内容・機能、またはブランドに関係のないもの（通常のメタデータのガイドラインにも従う）

## 勧められていること

- **ヘッダ**：伝えることは1つにしぼり、詰め込まない。初めて見る人に何が一番響くかを考える
- **検索結果**：アプリの目的がひと目でわかるようにする。画面や中身を見せるとよい
- **文字**：短い一言にし、絵を説明するのではなく引き立てる。対応しているすべての言語にローカライズする（SubscBox は日本語のみ）
- 小さく表示されても読めるようにする

## SubscBox で作るときの方針（2026-11-12 時点）

- 他社のサービスのロゴは入れない。`design/store-screenshots/output*/` の画像は他社のロゴが写っているので、そのままは使えない。ロゴのあるサービスを入れていないデータで、撮ったままのスクリーンショットを撮り直して使う
- 入れるもの：アプリのアイコン・「SubscBox」・キャッチコピー1つ（案：サブスク支出をひと目で管理）・iPhone の画面1つ。どれもセーフエリアの中に置く
- 画面に出ている金額は、アプリの価格ではない（サブスクの例の金額）。それでも、プレミアムプランの価格（¥480）は入れない

## 出典

- [Creative assets specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications/)
- [App Store Asset Best Practices and Resources](https://developer.apple.com/app-store/asset-best-practices/)
- [Manage your App Store assets](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets/)
- [Enhance your presence on the App Store（WWDC26）](https://developer.apple.com/videos/play/wwdc2026/205/)
