// このファイルは scripts/generate-service-logos.js が生成する（手で編集しない）
/** require() した画像のアセットID */
type ImageAsset = number;

export const serviceLogos: Partial<Record<string, ImageAsset>> = {
  chatgpt: require('@/assets/service-logos/chatgpt.png'),
  spotify: require('@/assets/service-logos/spotify.png'),
  x_premium: require('@/assets/service-logos/x_premium.png'),
  youtube: require('@/assets/service-logos/youtube.png'),
};
