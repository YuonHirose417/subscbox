import { MockPremiumService } from './MockPremiumService';

export type * from './PremiumService';

// フェーズ7で RevenueCatPremiumService に差し替える（Expo Go・キー未設定時は Mock のまま）
export const premiumService = new MockPremiumService();
