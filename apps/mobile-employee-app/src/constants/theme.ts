/**
 * PolyFit Mobile Design System v1.0
 * Based on Stitch Design Center (projects/16498663316307719095)
 */

import '@/global.css';
import { Platform } from 'react-native';

export const Palette = {
  // Midnight Navy: Primary structural surfaces, headers, high-contrast text
  navy: '#0B1F33',
  navyDark: '#071521',
  navySurface: '#0D2235',
  navyElevated: '#132D43',
  navyBorder: '#21405A',

  // Electric Green: Primary action CTAs, verified badges, active pass timers
  // STRICT ACCESSIBILITY RULE: NEVER PUT WHITE TEXT ON ELECTRIC GREEN. ALWAYS NAVY (#0B1F33).
  green: '#28D17C',
  greenHover: '#22BC6E',
  greenSubtle: '#E9FAF2',
  greenText: '#008A4B',
  greenBorder: '#B7F1D2',

  // Kinetic Teal: Secondary telemetry highlights, amenity chips, category markers
  teal: '#00D2B4',
  tealSubtle: '#E0F9F5',
  tealText: '#007A68',
  tealBorder: '#A7F3E5',

  // Neutrals
  canvas: '#F7F9FC',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  textPrimary: '#0B1F33',
  textSecondary: '#526173',
  textMuted: '#8491A3',
  textInverse: '#FFFFFF',

  // Status & Alerts
  warningBg: '#FEF3C7',
  warningText: '#D97706',
  warningBorder: '#FDE68A',
  errorBg: '#FEE2E2',
  errorText: '#DC2626',
  errorBorder: '#FECACA',
} as const;

export const Colors = {
  light: {
    text: Palette.textPrimary,
    textSecondary: Palette.textSecondary,
    textMuted: Palette.textMuted,
    background: Palette.canvas,
    backgroundElement: '#ECEFF4',
    backgroundSelected: '#E2E8F0',
    card: Palette.card,
    border: Palette.cardBorder,
    tint: Palette.navy,
    accent: Palette.green,
    accentSubtle: Palette.greenSubtle,
    secondary: Palette.teal,
  },
  dark: {
    text: Palette.textInverse,
    textSecondary: '#A0AEC0',
    textMuted: '#718096',
    background: Palette.navyDark,
    backgroundElement: Palette.navySurface,
    backgroundSelected: Palette.navyElevated,
    card: Palette.navySurface,
    border: Palette.navyBorder,
    tint: Palette.green,
    accent: Palette.green,
    accentSubtle: '#143328',
    secondary: Palette.teal,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
  eight: 80,
} as const;

export const Radius = {
  sm: 4,
  inner: 8,
  md: 8,
  btn: 10,
  card: 14,
  lg: 14,
  full: 9999,
} as const;

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
