import Constants from 'expo-constants';

/** アプリのバージョン（app.config.ts の version） */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/**
 * お問い合わせ先。メールアドレス（例：support@example.com）か、フォームの URL（https://…）のどちらかを書く。
 * 空のあいだは「準備中」を表示する。
 */
export const SUPPORT_CONTACT = 'yuon.hirose.info@gmail.com';

/**
 * 規約・プライバシーポリシーの公開先（GitHub Pages。リポジトリの docs/ フォルダを公開する）。
 * App Store Connect にも同じ URL を登録する。
 */
export const LEGAL_BASE_URL = 'https://yuonhirose417.github.io/subscbox';
export const PRIVACY_POLICY_URL = `${LEGAL_BASE_URL}/privacy.html`;
export const TERMS_URL = `${LEGAL_BASE_URL}/terms.html`;
