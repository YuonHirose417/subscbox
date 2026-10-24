export type AdsModule = typeof import('react-native-google-mobile-ads');

/** Web では広告を使わない（ネイティブ専用のモジュールを束ねないための空実装） */
export function loadAdsModule(): AdsModule | null {
  return null;
}
