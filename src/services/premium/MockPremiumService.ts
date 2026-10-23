import type {
  PremiumOffering,
  PremiumService,
  PremiumStatus,
  PurchaseResult,
} from './PremiumService';

/**
 * フェーズ7まで使うモック。購入は「準備中」として常にエラーを返す。
 * 開発中は setPremiumForDev() でプレミアム状態を切り替えて機能制限を確認する。
 */
export class MockPremiumService implements PremiumService {
  private isPremium = false;
  private listeners = new Set<(isPremium: boolean) => void>();

  async initialize(): Promise<void> {}

  async getStatus(): Promise<PremiumStatus> {
    return { isPremium: this.isPremium };
  }

  async getOfferings(): Promise<PremiumOffering[]> {
    return [];
  }

  async purchase(): Promise<PurchaseResult> {
    return { status: 'error', message: '準備中です' };
  }

  async restore(): Promise<{ isPremium: boolean }> {
    return { isPremium: this.isPremium };
  }

  onStatusChange(cb: (isPremium: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  setPremiumForDev(value: boolean): void {
    this.isPremium = value;
    this.listeners.forEach((cb) => cb(value));
  }
}
