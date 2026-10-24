import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { logger } from '@/utils/logger';

import { loadAdsModule, type AdsModule } from './loadAdsModule';


/**
 * 広告（Google AdMob・無料版のみ）。
 * ネイティブモジュールは Expo Go・Web には無く、読み込むだけで落ちるため、使える環境でだけ require する。
 * 方針：トラッキング許可（ATT）は求めず、非パーソナライズ広告のみを表示する。
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const adsSupported = Platform.OS === 'ios' && !isExpoGo;

function loadModule(): AdsModule | null {
  if (!adsSupported) return null;
  try {
    return loadAdsModule();
  } catch (error) {
    logger.error('ads module unavailable', error);
    return null;
  }
}

export const adsModule = loadModule();

/**
 * バナーの広告ユニット ID（.env の EXPO_PUBLIC_ADMOB_IOS_BANNER_ID）。
 * 開発中はテスト広告を使う。本番で未設定なら広告を出さない（テスト広告を本番に出さないため）。
 */
export const bannerUnitId: string | null = !adsModule
  ? null
  : __DEV__
    ? adsModule.TestIds.ADAPTIVE_BANNER
    : process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID || null;

/** すべての広告リクエストに付ける。非パーソナライズ広告のみ */
export const AD_REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true } as const;

type AdsState = {
  /** 同意の確認と SDK の初期化が済み、広告をリクエストしてよい */
  canRequestAds: boolean;
  /** 地域の規制（EEA 等）により、設定画面に「広告のプライバシー設定」を出す必要がある */
  privacyOptionsRequired: boolean;
};

export const useAdsStore = create<AdsState>(() => ({
  canRequestAds: false,
  privacyOptionsRequired: false,
}));

let started = false;

/**
 * 無料版で起動したときに1回呼ぶ。必要な地域では Google の同意画面（UMP）を出してから SDK を初期化する。
 * プレミアムでは呼ばない（広告 SDK を初期化しない）。
 */
export async function startAds(): Promise<void> {
  if (!adsModule || started) return;
  started = true;
  const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } = adsModule;
  const mobileAds = adsModule.default;
  try {
    const info = await AdsConsent.gatherConsent();
    useAdsStore.setState({
      privacyOptionsRequired:
        info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    });
  } catch (error) {
    // 同意の確認に失敗しても、前回の同意状態で広告のリクエストを試みる（Google の推奨）
    logger.error('ads consent failed', error);
  }
  try {
    const { canRequestAds } = await AdsConsent.getConsentInfo();
    if (!canRequestAds) return;
    await mobileAds().initialize();
    useAdsStore.setState({ canRequestAds: true });
  } catch (error) {
    logger.error('ads init failed', error);
  }
}

/** 設定画面から広告のプライバシー設定（同意の変更）を開く */
export async function showAdPrivacyOptions(): Promise<void> {
  if (!adsModule) return;
  await adsModule.AdsConsent.showPrivacyOptionsForm();
}
