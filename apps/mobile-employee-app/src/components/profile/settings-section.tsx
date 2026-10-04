/**
 * PolyFit Corporate Employee App - Settings & Preferences (PF-102)
 * Notification preferences, concierge entry point, multi-tenant demo switcher, and secure logout
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert, Platform } from 'react-native';
import {
  Bell,
  HelpCircle,
  Layers,
  LogOut,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { EmployeeNotificationSettings } from '@/types/auth';

interface SettingsSectionProps {
  settings: EmployeeNotificationSettings;
  currentOrgDomain?: string;
  onUpdateSettings: (settings: Partial<EmployeeNotificationSettings>) => void;
  onOpenSupport: () => void;
  onSwitchTenant: (type: 'bk' | 'techcorp') => void;
  onLogout: () => void;
}

export function SettingsSection({
  settings,
  currentOrgDomain = 'bk.rw',
  onUpdateSettings,
  onOpenSupport,
  onSwitchTenant,
  onLogout,
}: SettingsSectionProps) {
  const [showTenantSwitcher, setShowTenantSwitcher] = useState(false);

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Log out from PolyFit? Offline cryptographic pass keys will be cleared from this device.')) {
        onLogout();
      }
    } else {
      Alert.alert(
        'Confirm Log Out',
        'Offline cryptographic pass keys and cached benefit data will be cleared from SecureStore.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: onLogout },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Notification Preferences */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Bell size={15} color={Palette.teal} />
          <Text style={styles.cardTitle}>Notification Preferences</Text>
        </View>

        <View style={styles.settingRowsList}>
          {/* Check-in Alerts */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Visit Check-In Confirmations</Text>
              <Text style={styles.settingSub}>Instant alerts when facility receptionist scans pass</Text>
            </View>
            <Switch
              value={settings.checkInAlerts}
              onValueChange={(val) => onUpdateSettings({ checkInAlerts: val })}
              trackColor={{ false: '#1E293B', true: Palette.green }}
              thumbColor={settings.checkInAlerts ? '#0B1F33' : '#94A3B8'}
            />
          </View>

          {/* Quota Alerts */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Monthly Quota Low Alerts</Text>
              <Text style={styles.settingSub}>Reminder when 2 visits remain in cycle</Text>
            </View>
            <Switch
              value={settings.quotaLowAlerts}
              onValueChange={(val) => onUpdateSettings({ quotaLowAlerts: val })}
              trackColor={{ false: '#1E293B', true: Palette.green }}
              thumbColor={settings.quotaLowAlerts ? '#0B1F33' : '#94A3B8'}
            />
          </View>

          {/* Network Expansion */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>New Partner Additions</Text>
              <Text style={styles.settingSub}>Updates when new gyms or pools join Kigali network</Text>
            </View>
            <Switch
              value={settings.networkAdditionsAlerts}
              onValueChange={(val) => onUpdateSettings({ networkAdditionsAlerts: val })}
              trackColor={{ false: '#1E293B', true: Palette.green }}
              thumbColor={settings.networkAdditionsAlerts ? '#0B1F33' : '#94A3B8'}
            />
          </View>
        </View>
      </View>

      {/* 2. Help & Corporate Concierge Action */}
      <Pressable
        style={({ pressed }) => [
          styles.supportCardBtn,
          pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        ]}
        onPress={onOpenSupport}
      >
        <View style={styles.supportCardIcon}>
          <HelpCircle size={18} color={Palette.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.supportCardTitle}>Help, Concierge & FAQs</Text>
          <Text style={styles.supportCardSub}>WhatsApp enterprise support & benefit policies</Text>
        </View>
      </Pressable>

      {/* 3. Multi-Tenant Demo Switcher (Collapsible for Testing) */}
      <View style={styles.card}>
        <Pressable
          style={styles.collapsibleHeader}
          onPress={() => setShowTenantSwitcher(!showTenantSwitcher)}
        >
          <View style={styles.cardHeader}>
            <Layers size={15} color={Palette.teal} />
            <Text style={styles.cardTitle}>Multi-Tenant Testing Switcher</Text>
          </View>
          {showTenantSwitcher ? (
            <ChevronUp size={16} color={Palette.textMuted} />
          ) : (
            <ChevronDown size={16} color={Palette.textMuted} />
          )}
        </Pressable>

        {showTenantSwitcher && (
          <View style={styles.switcherContent}>
            <Text style={styles.switcherSub}>
              Switch between enrolled corporate accounts to test different subsidy models:
            </Text>

            <View style={styles.demoList}>
              <Pressable
                style={[
                  styles.demoItem,
                  currentOrgDomain === 'bk.rw' && styles.demoItemActive,
                ]}
                onPress={() => onSwitchTenant('bk')}
              >
                <Building2
                  size={16}
                  color={currentOrgDomain === 'bk.rw' ? Palette.green : Palette.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoTitle}>Bank of Kigali</Text>
                  <Text style={styles.demoDesc}>100% Fully Sponsored • 12 Visits/mo</Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.demoItem,
                  currentOrgDomain === 'techcorp.rw' && styles.demoItemActive,
                ]}
                onPress={() => onSwitchTenant('techcorp')}
              >
                <Building2
                  size={16}
                  color={currentOrgDomain === 'techcorp.rw' ? Palette.green : Palette.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoTitle}>TechCorp Rwanda</Text>
                  <Text style={styles.demoDesc}>85% Corporate Subsidy • 8 Visits/mo</Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* 4. Secure Sign Out CTA */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutBtn,
          pressed && { opacity: 0.8 },
        ]}
        onPress={confirmLogout}
      >
        <LogOut size={16} color="#FF5A65" />
        <Text style={styles.logoutBtnText}>Log Out / Reset Pass Keys</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  card: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  settingRowsList: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  settingTextCol: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingSub: {
    fontSize: 10,
    color: Palette.textMuted,
    marginTop: 2,
  },

  // Support Card CTA
  supportCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 180, 0.25)',
  },
  supportCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 210, 180, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  supportCardSub: {
    fontSize: 11,
    color: Palette.teal,
    marginTop: 2,
  },

  // Collapsible Header
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switcherContent: {
    gap: 8,
    paddingTop: Spacing.two,
  },
  switcherSub: {
    fontSize: 11,
    color: Palette.textMuted,
    marginBottom: 4,
  },
  demoList: {
    gap: 8,
  },
  demoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  demoItemActive: {
    borderColor: Palette.green,
    backgroundColor: 'rgba(40, 209, 124, 0.08)',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoDesc: {
    fontSize: 10,
    color: Palette.textMuted,
    marginTop: 2,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 90, 101, 0.08)',
    borderRadius: Radius.btn,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 101, 0.25)',
    marginTop: 4,
  },
  logoutBtnText: {
    color: '#FF5A65',
    fontSize: 13,
    fontWeight: '700',
  },
});
