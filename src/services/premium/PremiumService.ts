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
  | { status: 'error'; message: string };

/** 本アプリ自身のプレミアムプランの課金管理（フェーズ7で RevenueCat 実装に差し替え） */
export interface PremiumService {
  initialize(): Promise<void>;
  getStatus(): Promise<PremiumStatus>;
  getOfferings(): Promise<PremiumOffering[]>;
  purchase(packageId: string): Promise<PurchaseResult>;
  restore(): Promise<{ isPremium: boolean }>;
  onStatusChange(cb: (isPremium: boolean) => void): () => void;
}
