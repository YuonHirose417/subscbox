export type PremiumStatus = { isPremium: boolean; expiresAt?: string };

export type PremiumOffering = {
  packageId: string;
  title: string;
  /** ストアから取得したローカライズ済み価格文字列（ハードコードしない） */
  priceString: string;
  period?: 'monthly' | 'yearly' | 'lifetime';
};

export type PurchaseResult =
  | { status: 'success'; isPremium: boolean }
  | { status: 'cancelled' }
  /** 保護者の承認待ちなど。承認されると onStatusChange で通知される */
  | { status: 'pending' }
  | { status: 'error'; message: string };

/**
 * 本アプリ自身のプレミアムプランの課金管理。
 * 実装は RevenueCat（本番・development build）と Mock（Expo Go・キー未設定・Web）の2つ。
 */
export interface PremiumService {
  /** 'revenuecat' | 'mock'（開発用の表示に使う） */
  readonly kind: 'revenuecat' | 'mock';
  initialize(): Promise<void>;
  getStatus(): Promise<PremiumStatus>;
  getOfferings(): Promise<PremiumOffering[]>;
  purchase(packageId: string): Promise<PurchaseResult>;
  restore(): Promise<{ isPremium: boolean }>;
  onStatusChange(cb: (isPremium: boolean) => void): () => void;
}
