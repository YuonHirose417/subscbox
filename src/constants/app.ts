import Constants from 'expo-constants';

/** アプリのバージョン（app.config.ts の version） */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/**
 * お問い合わせ先のメールアドレス。公開前に設定する（空のあいだは「準備中」を表示）。
 * 個人のアドレスを直接書かず、サポート用のアドレスを用意することを推奨。
 */
export const SUPPORT_EMAIL = '';

/** プライバシーポリシー・利用規約の公開 URL（App Store Connect にも同じものを登録する。フェーズ7で設定） */
export const PRIVACY_POLICY_URL = '';
export const TERMS_URL = '';
