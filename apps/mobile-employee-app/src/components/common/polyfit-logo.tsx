import React from 'react';
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Palette } from '@/constants/theme';

interface PolyFitLogoProps {
  size?: number;
  showWordmark?: boolean;
  showSubtitle?: boolean;
  theme?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
}

/**
 * 3D Isometric Hexagonal 'P' Logo Mark
 * Precise 6-Facet Axonometric Projection matching logo Partner.jpg, logo.jpg, and image.png
 */
export function IsometricHexMark({ size = 36 }: { size?: number }) {
  if (Platform.OS === 'web') {
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
            <linearGradient id="m-pf-facet-teal-wall" x1="32" y1="36" x2="50" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0B6B4F" />
              <stop offset="100%" stopColor="#074835" />
            </linearGradient>
            <linearGradient id="m-pf-facet-navy-wall" x1="36" y1="26" x2="68" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F2840" />
              <stop offset="100%" stopColor="#08131F" />
            </linearGradient>
          </defs>

          <g stroke="#08131F" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
            {/* 1. Outer Hexagon Roof Plane */}
            <path d="M50 10L82 28.5L68 36.5L50 26L32 36.5L18 28.5L50 10Z" fill="url(#m-pf-facet-top)" />

            {/* 2. Upper Loop Outer Right Facet */}
            <path d="M82 28.5V56.5L68 64.5V36.5L82 28.5Z" fill="url(#m-pf-facet-right)" />

            {/* 3. Midnight Navy Loop Inner Ceiling & Wall [Dark Block 2] */}
            <path d="M50 26L68 36.5V64.5L50 54V26Z" fill="url(#m-pf-facet-navy-wall)" />

            {/* 4. Main Left Vertical Stem Front Face */}
            <path d="M18 28.5V75.5L32 83.5V36.5L18 28.5Z" fill="url(#m-pf-facet-left)" />

            {/* 5. Deep Teal Inner Stem Vertical Wall [Dark Block 1] */}
            <path d="M32 36.5V83.5L50 94V66L32 55.5V36.5Z" fill="url(#m-pf-facet-teal-wall)" />

            {/* 6. Stem Bottom Base Return */}
            <path d="M18 75.5L50 94V86L32 75.5L18 75.5Z" fill="url(#m-pf-facet-left)" />

            {/* 7. Middle Loop Return Crossbar */}
            <path d="M32 55.5L50 66L68 55.5L50 45L32 55.5Z" fill="url(#m-pf-facet-top)" />
          </g>
        </svg>
      </View>
    );
  }

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
            Poly<Text style={{ color: Palette.green }}>Fit</Text>
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
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textLight: {
    color: '#0B1F33',
  },
  subtitle: {
    fontSize: 9,
    color: Palette.textSecondary,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
