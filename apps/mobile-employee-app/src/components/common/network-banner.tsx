import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

interface NetworkBannerProps {
  isOffline: boolean;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <WifiOff size={14} color={Palette.teal} />
      <Text style={styles.text}>
        Offline Mode Active • Dynamic QR access vault running with local cryptographic signature
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#0D2235',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 210, 180, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 100,
      },
    }),
  },
  text: {
    color: Palette.teal,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
