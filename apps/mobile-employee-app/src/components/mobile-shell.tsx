/**
 * PolyFit Mobile Device Frame & Responsive Shell
 * Ensures true mobile phone fidelity in browser previews and native devices.
 */

import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform, StatusBar } from 'react-native';
import { Palette, Radius } from '@/constants/theme';

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 600;

  if (!isDesktopWeb) {
    return (
      <View style={styles.nativeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B1F33" />
        {children}
        {Platform.OS === 'web' && (
          <View
            nativeID="polyfit-mobile-modal-portal"
            style={styles.modalPortalContainer}
            pointerEvents="box-none"
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.desktopBackdrop}>
      {/* Desktop Ambient Glow */}
      <View style={styles.ambientGlow} />

      {/* Realistic Mobile Device Container (iPhone 16 Pro silhouette) */}
      <View style={styles.deviceFrame}>
        {/* Device Outer Bezel */}
        <View style={styles.deviceBezel}>
          {/* Dynamic Island / Speaker Pill */}
          <View style={styles.notchContainer}>
            <View style={styles.dynamicIsland}>
              <View style={styles.cameraLens} />
            </View>
          </View>

          {/* Screen Content Viewport */}
          <View style={styles.screenViewport}>
            <StatusBar barStyle="light-content" />
            {children}
          </View>

          {/* Dedicated Modal Portal Target for Web Previews */}
          {Platform.OS === 'web' && (
            <View
              nativeID="polyfit-mobile-modal-portal"
              style={styles.modalPortalContainer}
              pointerEvents="box-none"
            />
          )}

          {/* iOS Home Indicator Bar */}
          <View style={styles.homeIndicatorContainer}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    backgroundColor: '#071521',
  },
  modalPortalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    overflow: 'hidden',
    pointerEvents: 'box-none',
  },
  desktopBackdrop: {
    flex: 1,
    backgroundColor: '#050D15',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(40, 209, 124, 0.04)',
    top: '20%',
    filter: 'blur(80px)' as any,
  },
  deviceFrame: {
    width: 400,
    height: 844,
    maxHeight: '96%',
    borderRadius: 50,
    backgroundColor: '#1E293B',
    padding: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.7,
        shadowRadius: 25,
        elevation: 20,
      },
    }),
  },
  deviceBezel: {
    flex: 1,
    backgroundColor: '#071521',
    borderRadius: 42,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  notchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    pointerEvents: 'none',
  },
  dynamicIsland: {
    width: 110,
    height: 28,
    backgroundColor: '#000000',
    borderRadius: 14,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  cameraLens: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  screenViewport: {
    flex: 1,
    paddingTop: 36,
  },
  homeIndicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    pointerEvents: 'none',
  },
  homeIndicator: {
    width: 134,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 4,
  },
});
