# サブスクBox 公開までの手作業の手順書

コードの側で済ませたこと（RevenueCat・AdMob の組み込み、ペイウォール、規約ページの生成、`eas.json`）を前提に、ご自身で行う作業を順番にまとめています。上から順に進めてください。

> 記号：☐ = 作業、📝 = 控えておく値（あとの手順で使う）

---

## 0. 決めてある前提

| 項目 | 値 |
|---|---|
| Bundle ID | `com.yuonhirose.subscbox` |
| 課金 | 買い切り（非消耗型）1商品 |
| 商品 ID（提案） | `com.yuonhirose.subscbox.pro` |
| RevenueCat の Entitlement | `pro`（コードの `ENTITLEMENT_ID` と一致させる） |
| RevenueCat の Offering | `default`（Current に設定）／ Package は Lifetime |
| 広告 | AdMob バナー（無料版のみ、一覧・分析の末尾、非パーソナライズのみ、ATT なし） |
| 規約・ポリシー | GitHub Pages（`docs/` フォルダ） |
| お問い合わせ | yuon.hirose.info@gmail.com |

---

## 1. GitHub Pages で規約・ポリシーを公開する

アプリ内の規約・ポリシーへのリンクは `src/constants/app.ts` の `LEGAL_BASE_URL`（現在 `https://yuonhirose417.github.io/subscbox`）を使っています。GitHub のユーザー名・リポジトリ名が違う場合は、この値を変更してください。

公開の方法は次のどちらかです（無料プランの GitHub Pages は公開リポジトリが必要です）。

- **A. コードごと公開してよい場合**：リポジトリ `subscbox` を Public で作って push し、Pages を `main` ブランチの `/docs` フォルダから公開する。
- **B. コードは非公開にしたい場合（おすすめ）**：コードは Private のリポジトリ（例：`subscbox-app`）に置き、Public のリポジトリ `subscbox` を別に作って `docs/` の中身だけを置く。

☐ GitHub でリポジトリを作成する（A または B）
☐ Settings → Pages → Build and deployment → Source を「Deploy from a branch」、Branch を `main` と `/docs`（B の場合はルート `/`）にして Save
☐ 数分後に次の URL が開けることを確認する
  - `https://<ユーザー名>.github.io/subscbox/`（サポートページ）
  - `https://<ユーザー名>.github.io/subscbox/privacy.html`
  - `https://<ユーザー名>.github.io/subscbox/terms.html`

📝 プライバシーポリシー URL・サポート URL（App Store Connect で使う）

> 文面を変えたときは、`src/data/legal.ts` を編集して `npm run legal` を実行すると `docs/` が作り直されます（アプリ内の表示と公開ページが同じ文面になります）。

### app-ads.txt（AdMob 用）

AdMob は、App Store に登録した「マーケティング URL / サポート URL」の**ドメインのルート**に `app-ads.txt` を置くことを求めます。`https://<ユーザー名>.github.io/subscbox/` のようなプロジェクトサイトでは、ルート（`https://<ユーザー名>.github.io/app-ads.txt`）に置けません。

☐ GitHub で `<ユーザー名>.github.io` という名前の Public リポジトリを作り、ルートに `app-ads.txt` を置いて Pages を有効にする（中身は手順 4 で AdMob が表示する 1 行）
☐ App Store Connect の「マーケティング URL」に `https://<ユーザー名>.github.io/` を入れる

---

## 2. Apple Developer / App Store Connect

### 2-1. 契約・口座

☐ App Store Connect →「ビジネス」で **有料 App 契約（Paid Apps Agreement）** に同意し、銀行口座・税務情報を登録する（完了しないと課金のテストも本番もできません）

### 2-2. アプリを作る

☐ Apple Developer → Certificates, Identifiers & Profiles → Identifiers で `com.yuonhirose.subscbox` の App ID を作る（EAS Build でも自動で作れますが、先に作っておくと確実です）
  - Capabilities は **In-App Purchase** のみ（プッシュ通知は使いません）
☐ App Store Connect →「アプリ」→「＋」→ 新規 App
  - プラットフォーム：iOS ／ 名前：サブスクBox（使用済みなら「サブスクBox - サブスク管理」など）／ プライマリ言語：日本語 ／ バンドル ID：`com.yuonhirose.subscbox` ／ SKU：`subscbox`

📝 Apple ID（数字の App ID。App 情報 → 一般情報に表示される）→ `eas submit` で使う

### 2-3. アプリ内課金（買い切り）

☐ アプリ →「収益化」→「App 内課金」→「＋」
  - 種類：**非消耗型**
  - 参照名：プレミアムプラン ／ 製品 ID：`com.yuonhirose.subscbox.pro`
☐ 価格（例：¥480 など）を設定する（アプリは価格を App Store から取得して表示するので、コードの変更は不要）
☐ ローカリゼーション（日本語）：表示名「プレミアムプラン」、説明「広告なし・登録数無制限など、すべての機能が使えます（買い切り）」
☐ 審査用のスクリーンショット（ペイウォール画面）と審査メモを入れる
☐ 最初のアプリのバージョンを審査に出すときに、この App 内課金も一緒に提出する（「App 内課金」欄で選択）

### 2-4. RevenueCat 用のキー

☐ App Store Connect →「ユーザとアクセス」→「統合」→「App 内課金」→ キーを生成し、`.p8` をダウンロード（1回しかダウンロードできません）

📝 キー ID、Issuer ID、`.p8` ファイル

### 2-5. Sandbox テスター

☐「ユーザとアクセス」→「Sandbox」→ テスターを追加（実在しない用のメールアドレスでよい）
☐ iPhone の 設定 → App Store → 一番下の「Sandbox アカウント」でサインインする

---

## 3. RevenueCat

☐ RevenueCat にサインアップし、プロジェクト「サブスクBox」を作る
☐ Apps → ＋ → **App Store**
  - Bundle ID：`com.yuonhirose.subscbox`
  - In-App Purchase Key：2-4 の `.p8`・キー ID・Issuer ID を登録
☐ Product catalog → Products → `com.yuonhirose.subscbox.pro` を追加（App Store から読み込み）
☐ Entitlements → ＋ → Identifier を **`pro`** にして作成し、上の Product を Attach
☐ Offerings → `default` を作成（Current にする）→ Package を追加
  - Package の種類：**Lifetime**（識別子 `$rc_lifetime`）／ Product：`com.yuonhirose.subscbox.pro`
☐ Project settings → API keys → **Public** の Apple API key（`appl_` で始まる）をコピー

📝 `EXPO_PUBLIC_REVENUECAT_IOS_KEY`（公開用キー。**Secret key はアプリに入れない**）

---

## 4. AdMob

☐ AdMob にサインアップし、アプリ →「アプリを追加」→ iOS →「App Store に公開されていない」を選んで「サブスクBox」を追加
☐ 広告ユニット →「バナー」を作成（名前：一覧・分析の末尾）

📝 `EXPO_PUBLIC_ADMOB_IOS_APP_ID`（`ca-app-pub-…~…`）
📝 `EXPO_PUBLIC_ADMOB_IOS_BANNER_ID`（`ca-app-pub-…/…`）

☐ ブロックのコントロール → コンテンツ →「広告コンテンツの上限」を **G（全年齢）** にする（App Store の年齢区分 4+ に合わせる）
☐ プライバシーとメッセージ → **GDPR（欧州）** のメッセージを作成して公開する（EEA・英国の利用者には同意画面が出ます。アプリ側は対応済み）
  - 「広告のプライバシー設定」の行は、対象の地域でだけ「よくある質問」画面の下部に出ます
☐ アプリが App Store に公開されたら、AdMob のアプリ設定で App Store のアプリをリンクし、表示された `app-ads.txt` の行を手順 1 のファイルに書く

> 開発中（development build）は自動的に Google のテスト広告が出ます。**自分の本番広告を何度もタップしないでください**（アカウント停止の原因になります）。実機の本番広告を確認したいときは AdMob の「テストデバイス」に iPhone を登録してください。

---

## 5. EAS（ビルド・配布）

### 5-1. 準備

☐ Expo のアカウントでログイン：`npx eas-cli@latest login`
☐ プロジェクトを作成：`npx eas-cli@latest init`
  - `app.config.ts` は自動で書き換えられないため、表示された `projectId` を伝えてください（`extra.eas.projectId` と `owner` を追加します）

### 5-2. 環境変数（3 つとも公開用の値なので Visibility は Plain text でよい）

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_xxx --environment production --environment preview --environment development --visibility plaintext
npx eas-cli@latest env:create --name EXPO_PUBLIC_ADMOB_IOS_APP_ID --value "ca-app-pub-xxx~yyy" --environment production --environment preview --environment development --visibility plaintext
npx eas-cli@latest env:create --name EXPO_PUBLIC_ADMOB_IOS_BANNER_ID --value "ca-app-pub-xxx/zzz" --environment production --environment preview --environment development --visibility plaintext
```

ローカルで `npx expo start` するときは、`.env.example` をコピーして `.env` を作り、同じ値を入れます（`.env` はコミットされません）。

### 5-3. 署名情報（Distribution Certificate は新規作成しない）

上限 2 枚の Distribution Certificate を他のアプリと共用しているため、**既存の証明書を再利用**します。

☐ 先に、既存の証明書がどこにあるかを確認する
  - **他のアプリを EAS でビルドしている（同じ Expo アカウント）場合**：EAS に保存済みの証明書をそのまま選べます。
  - **Xcode などで作った証明書の場合**：その証明書を作った Mac のキーチェーンから `.p12`（パスワード付き）を書き出しておきます。`.p12` が無いと EAS では使えません（その場合は、作業前にご相談ください。**証明書の失効（Revoke）は絶対にしない**でください。共用している他のアプリの配布に影響します）。
☐ 対話形式で署名情報を設定する：`npx eas-cli@latest credentials -p ios`
  1. Build profile：`production` を選ぶ
  2. 「Distribution Certificate」の設定 → **既存の証明書を使う**（Use an existing Distribution Certificate）を選び、一覧から選択（または `.p12` とパスワードをアップロード）
  3. 「Provisioning Profile」→ subscbox 用に**新規作成してよい**（EAS に生成させる）
  4. `development` プロファイルでも同様に（Development 証明書は上限の対象外ですが、既存があれば再利用してかまいません）
☐ `eas build` の途中で **「Generate a new Apple Distribution Certificate?」と聞かれたら必ず No** を選び、既存のものを選択する

### 5-4. development build（購入・広告・通知の確認用）

☐ テストする iPhone を登録：`npx eas-cli@latest device:create`（表示される QR / URL を iPhone で開いてプロファイルをインストール）
☐ ビルド：`npx eas-cli@latest build -p ios --profile development`
☐ 完了後に表示される QR から iPhone にインストールし、`npx expo start` で接続して確認する

### 5-5. production build → TestFlight

☐ ビルド：`npx eas-cli@latest build -p ios --profile production`（ビルド番号は自動で増えます）
☐ 提出：`npx eas-cli@latest submit -p ios --latest`（2-2 の Apple ID を聞かれたら入力）
☐ App Store Connect → TestFlight で「輸出コンプライアンス」が不要になっていることを確認（`usesNonExemptEncryption: false` を設定済み）
☐ 内部テスターに自分を追加し、TestFlight アプリから最終確認する

---

## 6. 動作確認（development build ＋ Sandbox）

☐ 無料版：一覧・分析の一番下までスクロールすると「広告」のバナーが出る（ホーム・詳細・設定には出ない）
☐ 無料版：11件目を追加しようとするとペイウォールが開く
☐ ペイウォール：価格が App Store の価格（例：¥480）で表示される
☐ 購入 → Sandbox の確認 → 「ありがとうございます」→ 広告が消え、プレミアム機能が解放される
☐ 購入画面でキャンセル → 何も表示されず元に戻る
☐ 機内モードでペイウォールを開く →「ストアに接続できませんでした」と再試行ボタン
☐ アプリを削除 → 再インストール → 設定 → プレミアムプラン →「購入を復元」で戻る
☐ 別の Sandbox アカウント（未購入）で「購入を復元」→「復元できる購入はありませんでした」

> 買い切りなので「期限切れ」の確認はありません。

---

## 7. App Store の申請情報

### 7-1. App のプライバシー（栄養ラベル）

AdMob と RevenueCat が収集するデータを申告します。最新の内容は Google（AdMob の「Apple App Store のデータ開示」）と RevenueCat のドキュメントで確認してください。下は本アプリの設定（非パーソナライズ・ATT なし）での目安です。

| データの種類 | 収集元 | 用途 | ユーザーに関連付け | トラッキング |
|---|---|---|---|---|
| ID → デバイス ID | AdMob | 他社の広告、分析 | いいえ | いいえ |
| 使用状況データ → 製品の操作、広告データ | AdMob | 他社の広告、分析 | いいえ | いいえ |
| 診断 → その他の診断データ | AdMob | 他社の広告 | いいえ | いいえ |
| 位置情報 → おおよその場所 | AdMob（IP アドレスから推定） | 他社の広告 | いいえ | いいえ |
| 購入 → 購入履歴 | RevenueCat | App の機能 | いいえ | いいえ |
| ID → ユーザ ID（匿名の識別子） | RevenueCat | App の機能 | いいえ | いいえ |

- ユーザーが入力したサブスク情報・写真は端末内のみで、収集には当たりません。
- 「トラッキング」はすべて「いいえ」（ATT を使わず、非パーソナライズ広告のみのため）。

### 7-2. その他の項目

☐ プライバシーポリシー URL：手順 1 の `privacy.html`
☐ サポート URL：手順 1 のサポートページ
☐ 年齢区分：4+（質問票はすべて「なし」。広告は AdMob 側で G に制限）
☐ スクリーンショット：6.9 インチ（1320×2868）必須、6.5 インチ推奨
  - **他社のロゴを写さない**（ガイドライン 5.2）。アプリはロゴを同梱しておらず頭文字のアイコンで表示されるので、開発用の「サンプルを投入」のデータで撮影できます
☐ 説明文・キーワード・サブタイトル
☐ 審査メモ（例）：

```
本アプリはログイン不要です。すべてのデータは端末内に保存され、サブスクリプション情報は利用者が手動で入力します（外部サービスとは連携しません）。
プレミアムプランは買い切り（非消耗型）の App 内課金です。設定 → プレミアムプラン から購入・復元できます。
無料版では、サブスク一覧と支出の分析の画面下部に AdMob の広告（非パーソナライズ）を表示します。
```

---

## 8. 終わったら教えてほしいこと

- `eas init` で表示された `projectId` と Expo のユーザー名（`app.config.ts` に追加します）
- GitHub Pages の URL が `https://yuonhirose417.github.io/subscbox` と異なる場合はその URL
- development build での動作確認（手順 6）の結果
