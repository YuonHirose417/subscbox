export type AdsModule = typeof import('react-native-google-mobile-ads');

/** ネイティブ（iOS）：使える環境でだけ読み込む。Expo Go にはネイティブモジュールが無いので呼ばないこと */
export function loadAdsModule(): AdsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-google-mobile-ads') as AdsModule;
}
