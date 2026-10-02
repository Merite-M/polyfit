/**
 * PolyFit Brand Header with Isometric Hexagon Logo & Typography
 * Stitch Design System v1.0
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Fonts } from '@/constants/theme';

interface PolyFitBrandHeaderProps {
  subtitle?: string;
  compact?: boolean;
}

export const PolyFitBrandHeader: React.FC<PolyFitBrandHeaderProps> = ({
  subtitle = 'Corporate Wellness Network',
  compact = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Isometric Hexagon Brand Mark */}
      <View style={[styles.logoContainer, compact && styles.logoContainerCompact]}>
        <View style={styles.hexOuter}>
          <View style={styles.hexTopFacet} />
          <View style={styles.hexLeftFacet} />
          <View style={styles.hexRightFacet} />
          <View style={styles.hexInnerCutout} />
        </View>
      </View>

      <Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>
        Poly<Text style={styles.brandTitleAccent}>Fit</Text>
      </Text>

      {subtitle ? <Text style={styles.brandSubtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  containerCompact: {
    paddingVertical: Spacing.two,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.card,
    backgroundColor: Palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    shadowColor: Palette.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainerCompact: {
    width: 44,
    height: 44,
    marginBottom: Spacing.one,
  },
  hexOuter: {
    width: 32,
    height: 32,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexTopFacet: {
    position: 'absolute',
    top: 2,
    width: 16,
    height: 8,
    backgroundColor: Palette.green,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  hexLeftFacet: {
    position: 'absolute',
    bottom: 4,
    left: 2,
    width: 12,
    height: 16,
    backgroundColor: Palette.greenHover,
    borderRadius: 2,
  },
  hexRightFacet: {
    position: 'absolute',
    bottom: 4,
    right: 2,
    width: 12,
    height: 16,
    backgroundColor: Palette.teal,
    borderRadius: 2,
  },
  hexInnerCutout: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: Palette.navy,
    borderRadius: 2,
  },
  brandTitle: {
    fontFamily: Fonts?.sans,
    fontSize: 28,
    fontWeight: '800',
    color: Palette.navy,
    letterSpacing: -0.5,
  },
  brandTitleCompact: {
    fontSize: 22,
  },
  brandTitleAccent: {
    color: Palette.green,
  },
  brandSubtitle: {
    fontFamily: Fonts?.sans,
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
