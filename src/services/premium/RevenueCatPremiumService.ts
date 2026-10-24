import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';

import { logger } from '@/utils/logger';

import type {
  PremiumOffering,
  PremiumService,
  PremiumStatus,
  PurchaseResult,
} from './PremiumService';

/** RevenueCat の Entitlement ID（ダッシュボードの設定と合わせる） */
export const ENTITLEMENT_ID = 'pro';

function isPurchasesError(error: unknown): error is PurchasesError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/** ユーザーに見せる文言（技術的な内容は logger にだけ出す） */
export function purchaseErrorMessage(error: unknown): string {
  if (!isPurchasesError(error)) return 'もう一度お試しください。';
  switch (error.code) {
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return 'インターネットに接続できませんでした。通信環境を確認して、もう一度お試しください。';
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return 'この端末では購入が許可されていません（スクリーンタイムの設定などをご確認ください）。';
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return 'App Store で問題が発生しました。しばらくしてから、もう一度お試しください。';
    case PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR:
      return '処理中です。しばらくお待ちください。';
    default:
      return 'もう一度お試しください。';
  }
}

const isPro = (info: CustomerInfo) => info.entitlements.active[ENTITLEMENT_ID] !== undefined;

/**
 * RevenueCat による買い切り（非消耗型）の課金。公開用の SDK キーだけを使う（シークレットキーはアプリに含めない）。
 * 購入状態は SDK が端末にキャッシュするので、オフラインでも直前の状態で起動できる。
 */
export class RevenueCatPremiumService implements PremiumService {
  readonly kind = 'revenuecat' as const;
  private isPremium = false;
  private packages = new Map<string, PurchasesPackage>();
  private listeners = new Set<(isPremium: boolean) => void>();
  private initialized: Promise<void> | null = null;

  constructor(private readonly apiKey: string) {}

  initialize(): Promise<void> {
    this.initialized ??= (async () => {
      Purchases.configure({ apiKey: this.apiKey });
      Purchases.addCustomerInfoUpdateListener((info) => this.update(info));
      try {
        this.update(await Purchases.getCustomerInfo());
      } catch (error) {
        // オフライン等。購入状態は後で更新リスナーから届く
        logger.error('failed to read customer info', error);
      }
    })();
    return this.initialized;
  }

  private update(info: CustomerInfo) {
    const next = isPro(info);
    if (next === this.isPremium) return;
    this.isPremium = next;
    this.listeners.forEach((cb) => cb(next));
  }

  async getStatus(): Promise<PremiumStatus> {
    await this.initialize();
    return { isPremium: this.isPremium };
  }

  async getOfferings(): Promise<PremiumOffering[]> {
    await this.initialize();
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    this.packages = new Map(packages.map((p) => [p.identifier, p]));
    return packages.map((p) => ({
      packageId: p.identifier,
      title: p.product.title,
      priceString: p.product.priceString,
      period:
        p.packageType === PACKAGE_TYPE.LIFETIME
          ? 'lifetime'
          : p.packageType === PACKAGE_TYPE.ANNUAL
            ? 'yearly'
            : p.packageType === PACKAGE_TYPE.MONTHLY
              ? 'monthly'
              : undefined,
    }));
  }

  async purchase(packageId: string): Promise<PurchaseResult> {
    await this.initialize();
    const pkg = this.packages.get(packageId);
    if (!pkg) return { status: 'error', message: '商品情報を読み込めませんでした。' };
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      this.update(customerInfo);
      return { status: 'success', isPremium: isPro(customerInfo) };
    } catch (error) {
      if (isPurchasesError(error)) {
        if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          return { status: 'cancelled' };
        }
        if (error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return { status: 'pending' };
        if (error.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
          const restored = await this.restore();
          return { status: 'success', isPremium: restored.isPremium };
        }
      }
      logger.error('purchase failed', error);
      return { status: 'error', message: purchaseErrorMessage(error) };
    }
  }

  async restore(): Promise<{ isPremium: boolean }> {
    await this.initialize();
    const info = await Purchases.restorePurchases();
    this.update(info);
    return { isPremium: isPro(info) };
  }

  onStatusChange(cb: (isPremium: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}
