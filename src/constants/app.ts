import Constants from 'expo-constants';

/** アプリのバージョン（app.config.ts の version） */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/**
 * お問い合わせ先。メールアドレス（例：support@example.com）か、フォームの URL（https://…）のどちらかを書く。
 * 空のあいだは「準備中」を表示する。
 */
export const SUPPORT_CONTACT = '';

/** プライバシーポリシー・利用規約の公開 URL（App Store Connect にも同じものを登録する。フェーズ7で設定） */
export const PRIVACY_POLICY_URL = '';
export const TERMS_URL = '';
