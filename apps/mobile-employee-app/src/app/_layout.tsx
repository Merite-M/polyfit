import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MobileShell } from '@/components/mobile-shell';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { useAuthStore } from '@/stores/auth-store';
import { Palette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const isBenefitActivated = useAuthStore((s) => s.isBenefitActivated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments.length > 0 && segments[0] === '(auth)';

    if (!isBenefitActivated && !inAuthGroup) {
      const timer = setTimeout(() => {
        router.replace('/(auth)');
      }, 0);
      return () => clearTimeout(timer);
    } else if (isBenefitActivated && inAuthGroup) {
      const timer = setTimeout(() => {
        router.replace('/');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isBenefitActivated, segments[0], router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#071521' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initializeSession = useAuthStore((s) => s.initializeSession);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        await initializeSession();
      } catch (err) {
        console.warn('[RootLayout] Initialization failed:', err);
      } finally {
        if (mounted) {
          setIsReady(true);
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={Palette.green} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <MobileShell>
          <RootNavigation />
        </MobileShell>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0B1F33',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
