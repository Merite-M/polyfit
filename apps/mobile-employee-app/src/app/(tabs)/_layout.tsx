/**
 * PolyFit Corporate Employee App — Native 3-Tab Layout
 * Proper Expo Router Tabs navigator replacing the manual Zustand tab system.
 * Pass (QR Code) | Explore (Compass) | Profile (User)
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { QrCode, Compass, User } from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Palette.green,
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Pass',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBadge, focused && styles.tabIconBadgeActive]}>
              <QrCode size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBadge, focused && styles.tabIconBadgeActive]}>
              <Compass size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBadge, focused && styles.tabIconBadgeActive]}>
              <User size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 80 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 6,
    backgroundColor: '#0B1F33',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  tabItem: {
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
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
});
