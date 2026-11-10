import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ui';
import { useAdsBootstrap } from '@/features/ads/useAdsBootstrap';
import { SPLASH_FADE_MS, splashHideDelay } from '@/features/app/splash';
import { useAppInit } from '@/features/app/useAppInit';
import { useNotificationTap } from '@/features/notifications/useNotificationTap';
import { configureNotificationHandler } from '@/services/notifications';
import { ThemeProvider, useTheme } from '@/theme';

// スプラッシュ画面は最短 1.2 秒表示し、フェードで消す（準備に時間がかかったときは準備ができ次第すぐ消す）
const splashShownAt = Date.now();
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: SPLASH_FADE_MS });
configureNotificationHandler();

function RootStack() {
  const { colors, scheme } = useTheme();
  const { status, retry } = useAppInit();
  useNotificationTap(status === 'ready');
  useAdsBootstrap(status === 'ready');

  useEffect(() => {
    if (status === 'loading') return;
    const timer = setTimeout(
      () => SplashScreen.hideAsync().catch(() => {}),
      splashHideDelay(splashShownAt, Date.now()),
    );
    return () => clearTimeout(timer);
  }, [status]);

  if (status === 'loading') return null; // スプラッシュを表示したまま待つ

  if (status === 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ErrorState onRetry={retry} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* タブバーは使わない（カンプにないため）。画面遷移は Stack の push と追加モーダルのみ */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
