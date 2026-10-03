/**
 * PolyFit Corporate Employee App - Native Mobile Tab Navigation
 * Compliant with expo-native-ui, expo-animation, and vercel-react-native-skills
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { QrCode, Compass, Building2, User } from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import AccessPassScreen from '@/app/index';
import ExploreNetworkScreen from '@/app/explore';

export default function AppTabs() {
  const [activeTab, setActiveTab] = useState<'pass' | 'explore'>('pass');

  return (
    <View style={styles.container}>
      {/* Screen Viewport */}
      <View style={styles.screenArea}>
        {activeTab === 'pass' && <AccessPassScreen />}
        {activeTab === 'explore' && <ExploreNetworkScreen />}
      </View>

      {/* Native Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, activeTab === 'pass' && styles.tabItemActive]}
          onPress={() => setActiveTab('pass')}
        >
          <View style={[styles.tabIconBadge, activeTab === 'pass' && styles.tabIconBadgeActive]}>
            <QrCode size={20} color={activeTab === 'pass' ? Palette.green : Palette.textMuted} />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'pass' && styles.tabLabelActive]}>
            My Pass
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeTab === 'explore' && styles.tabItemActive]}
          onPress={() => setActiveTab('explore')}
        >
          <View style={[styles.tabIconBadge, activeTab === 'explore' && styles.tabIconBadgeActive]}>
            <Compass size={20} color={activeTab === 'explore' ? Palette.green : Palette.textMuted} />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'explore' && styles.tabLabelActive]}>
            Network
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071521',
  },
  screenArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 74 : 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    backgroundColor: '#0B1F33',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  tabItemActive: {},
  tabIconBadge: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  tabIconBadgeActive: {
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  tabLabelActive: {
    color: Palette.green,
    fontWeight: '700',
  },
});
