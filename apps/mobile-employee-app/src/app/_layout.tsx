import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import OnboardingScreen from '@/app/onboarding/index';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Palette } from '@/constants/theme';

import { MobileShell } from '@/components/mobile-shell';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isBenefitActivated, initializeSession } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initializeSession();
      } catch (err) {
        console.warn('[RootLayout] Initialization failed:', err);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    }
    init();
  }, [initializeSession]);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={Palette.green} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <MobileShell>
        {isBenefitActivated ? <AppTabs /> : <OnboardingScreen />}
      </MobileShell>
    </ThemeProvider>
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

