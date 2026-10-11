/**
 * PolyFit Official Brand Logo Component (Mobile Edition)
 * True 3D Isometric Hexagonal 'P' Mark from PolyFit Stitch Design System v1.0
 * Cross-platform vector on Web & retina-optimized asset on iOS/Android.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { Palette, Radius, Spacing } from '@/constants/theme';

interface PolyFitLogoProps {
  size?: number;
  showWordmark?: boolean;
  showSubtitle?: boolean;
  theme?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
}

/**
 * 3D Isometric Hexagonal 'P' Logo Mark
 * True 30° axonometric projection with facet gradients
 */
export function IsometricHexMark({ size = 36 }: { size?: number }) {
  if (Platform.OS === 'web') {
    // Crisp inline SVG for Web Virtualization & Chrome DevTools
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="PolyFit 3D Isometric Hexagonal Logo"
        >
          <defs>
            <linearGradient id="m-pf-facet-top" x1="20" y1="12" x2="80" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34E58C" />
              <stop offset="100%" stopColor="#28D17C" />
            </linearGradient>
            <linearGradient id="m-pf-facet-left" x1="16" y1="28" x2="52" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#28D17C" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="m-pf-facet-right" x1="48" y1="28" x2="84" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="m-pf-facet-inner" x1="36" y1="36" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0B1F33" />
              <stop offset="100%" stopColor="#142C44" />
            </linearGradient>
          </defs>

          {/* Outer Hexagon Letter 'P' Top Plane */}
          <path
            d="M50 10L82 28.5L68 36.5L50 26L32 36.5L18 28.5L50 10Z"
            fill="url(#m-pf-facet-top)"
          />

          {/* Upper Loop Outer Right Facet */}
          <path
            d="M82 28.5V56.5L68 64.5V36.5L82 28.5Z"
            fill="url(#m-pf-facet-right)"
          />

          {/* Loop Bottom Horizontal Plane */}
          <path
            d="M68 64.5L50 54V46L68 36.5V64.5Z"
            fill="url(#m-pf-facet-inner)"
          />

          {/* Main Left Vertical Stem */}
          <path
            d="M18 28.5V75.5L32 83.5V36.5L18 28.5Z"
            fill="url(#m-pf-facet-left)"
          />

          {/* Stem Bottom Base & Inner Return */}
          <path
            d="M18 75.5L50 94V86L32 75.5L18 75.5Z"
            fill="url(#m-pf-facet-left)"
          />

          {/* Lower Stem Face Facing Right */}
          <path
            d="M32 83.5L50 94V66L32 55.5V83.5Z"
            fill="url(#m-pf-facet-right)"
          />

          {/* Middle Loop Crossbar */}
          <path
            d="M32 55.5L50 66L68 55.5L50 45L32 55.5Z"
            fill="url(#m-pf-facet-top)"
          />
        </svg>
      </View>
    );
  }

  // Native iOS / Android retina raster fallback
  return (
    <Image
      source={require('@/assets/images/polyfit-logo-stitch.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * PolyFit Complete Brand Lockup (Mark + Wordmark)
 */
export function PolyFitLogo({
  size = 36,
  showWordmark = true,
  showSubtitle = false,
  theme = 'dark',
  style,
}: PolyFitLogoProps) {
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, style]}>
      <IsometricHexMark size={size} />

      {showWordmark && (
        <View style={styles.textContainer}>
          <Text style={[styles.wordmark, isDark ? styles.textDark : styles.textLight]}>
            POLY<Text style={{ color: Palette.green }}>FIT</Text>
          </Text>

          {showSubtitle && (
            <Text style={styles.subtitle}>Corporate Wellness Network</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textContainer: {
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textLight: {
    color: '#0B1F33',
  },
  subtitle: {
    fontSize: 10,
    color: Palette.textSecondary,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.3,
  },
});
