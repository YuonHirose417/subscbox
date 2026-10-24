import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { MockPremiumService } from './MockPremiumService';
import type { PremiumService } from './PremiumService';
import { RevenueCatPremiumService } from './RevenueCatPremiumService';

export type * from './PremiumService';
export { MockPremiumService };

/** RevenueCat の公開用 iOS SDK キー（.env の EXPO_PUBLIC_REVENUECAT_IOS_KEY） */
const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function createPremiumService(): PremiumService {
  // Expo Go・キー未設定・iOS 以外では Mock を使う（購入処理を抽象化しているので、どちらでもアプリは動く）
  if (Platform.OS === 'ios' && !isExpoGo && apiKey) return new RevenueCatPremiumService(apiKey);
  return new MockPremiumService();
}

export const premiumService: PremiumService = createPremiumService();
