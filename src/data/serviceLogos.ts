// このファイルは scripts/generate-service-logos.js が生成する（手で編集しない）
/** require() した画像のアセットID */
type ImageAsset = number;

export const serviceLogos: Partial<Record<string, ImageAsset>> = {
  amazon_prime: require('@/assets/service-logos/amazon_prime.png'),
  chatgpt: require('@/assets/service-logos/chatgpt.png'),
  disney_plus: require('@/assets/service-logos/disney_plus.png'),
  notion: require('@/assets/service-logos/notion.png'),
  spotify: require('@/assets/service-logos/spotify.png'),
  x_premium: require('@/assets/service-logos/x_premium.png'),
  youtube: require('@/assets/service-logos/youtube.png'),
};
