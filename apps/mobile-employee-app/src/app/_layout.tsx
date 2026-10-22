import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MobileShell } from '@/components/mobile-shell';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { useAuthStore } from '@/stores/auth-store';
import { Palette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
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
