import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'サブスクBox',
  slug: 'subscbox',
  // EAS（Expo アカウント yuon）。Distribution Certificate を hairlog と共用するため同じアカウントに置く
  owner: 'yuon',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'subscbox',
  userInterfaceStyle: 'automatic',
  ios: {
    // アプリアイコン（assets/images/icon-source.png から 1024×1024・透過なしで作ったもの）
    icon: './assets/images/icon.png',
    bundleIdentifier: 'com.yuonhirose.subscbox',
    supportsTablet: false,
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.yuonhirose.subscbox',
    adaptiveIcon: {
      backgroundColor: '#000000',
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
        // 角丸のアプリアイコンを中央に出す
        imageWidth: 120,
        dark: { backgroundColor: '#0B0D14' },
      },
    ],
  ],
  extra: {
    ...config.extra,
    eas: { projectId: 'f764f772-569e-4859-adee-fecad9b7d193' },
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
