/**
 * PolyFit Mobile Design System v1.0
 * 
 * This file now re-exports from the shared @polyfit/ui-theme package.
 * All design tokens are centralized in packages/ui-theme/src/index.ts
 * 
 * Mobile-specific additions (Platform-specific shadows, insets) remain here.
 */

import { Platform } from 'react-native';
import {
  Palette,
  Colors,
  Spacing,
  Radius,
  type ThemeColor,
} from '@polyfit/ui-theme';

export { Palette, Colors, Spacing, Radius, ThemeColor };

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter, system-ui',
    mono: 'JetBrains Mono, ui-monospace',
  },
  default: {
    sans: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  web: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
});

export const Shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0 1px 3px 0 rgba(11, 31, 51, 0.05), 0 1px 2px -1px rgba(11, 31, 51, 0.03)',
    },
    default: {
      shadowColor: '#0B1F33',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
  }),
  cardHover: Platform.select({
    web: {
      boxShadow: '0 8px 20px -4px rgba(11, 31, 51, 0.08), 0 4px 6px -2px rgba(11, 31, 51, 0.04)',
    },
    default: {
      shadowColor: '#0B1F33',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  }),
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 600;
