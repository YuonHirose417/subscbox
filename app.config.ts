import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'サブスクBox',
  slug: 'subscbox',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'subscbox',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.yuonhirose.subscbox',
    supportsTablet: false,
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.yuonhirose.subscbox',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    // ローカル通知のみ使う（プッシュ通知は使わないので APNs の entitlement を付けない）
    ['expo-notifications', { enableRemoteNotifications: false }],
    // 広告（無料版のみ・非パーソナライズ。ATT は使わないので userTrackingUsageDescription は設定しない）
    [
      'react-native-google-mobile-ads',
      {
        // 未設定時は Google のテスト用アプリ ID（本番では EAS の環境変数に本物を設定する）
        iosAppId:
          process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511',
        androidAppId: 'ca-app-pub-3940256099942544~3347511713',
        // 同意の確認より前に計測を始めない
        delayAppMeasurementInit: true,
        // Google の SKAdNetwork ID（他の広告ネットワークを使う場合は追加する）
        skAdNetworkItems: ['cstr6suwn9.skadnetwork'],
      },
    ],
    // アイコン画像（プレミアム）の選択。写真ライブラリからの選択のみでカメラ・マイクは使わない
    [
      'expo-image-picker',
      {
        photosPermission:
          'サブスクのアイコンに使う写真を選ぶために、写真ライブラリにアクセスします。',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5F6FA',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
        dark: { backgroundColor: '#0B0D14' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
