import type {
  PremiumOffering,
  PremiumService,
  PremiumStatus,
  PurchaseResult,
} from './PremiumService';

const DEV_PACKAGE_ID = '$rc_lifetime';

/**
 * RevenueCat を使えない環境（Expo Go・API キー未設定・Web）での実装。
 * 開発中（__DEV__）は購入の流れを試せるよう、テスト用の買い切り商品を返し、購入するとプレミアムになる。
 * 本番ビルドで使われた場合は商品を返さず、ペイウォールは「ストアに接続できません」を表示する。
 */
export class MockPremiumService implements PremiumService {
  readonly kind = 'mock' as const;
  private isPremium = false;
  private listeners = new Set<(isPremium: boolean) => void>();

  async initialize(): Promise<void> {}

  async getStatus(): Promise<PremiumStatus> {
    return { isPremium: this.isPremium };
  }

  async getOfferings(): Promise<PremiumOffering[]> {
    if (!__DEV__) return [];
    return [
      {
        packageId: DEV_PACKAGE_ID,
        title: 'プレミアム（買い切り・テスト）',
        priceString: '¥—（テスト）',
        period: 'lifetime',
      },
    ];
  }

  async purchase(packageId: string): Promise<PurchaseResult> {
    if (!__DEV__ || packageId !== DEV_PACKAGE_ID) {
      return { status: 'error', message: 'ストアに接続できませんでした。' };
    }
    this.setPremiumForDev(true);
    return { status: 'success', isPremium: true };
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
