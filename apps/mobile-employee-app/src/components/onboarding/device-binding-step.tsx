/**
 * PolyFit Corporate Employee App - Step 4: Device Permissions & Pass Provisioning
 * PF-105: Frictionless Corporate Employee Onboarding & Benefit Activation
 * Compliant with expo-native-ui, expo-animation, and vercel-react-native-skills
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { ShieldCheck, Fingerprint, MapPin, ArrowRight, Lock } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Palette, Radius, Spacing, Fonts } from '@/constants/theme';

interface DeviceBindingStepProps {
  onFinish: () => void;
}

export const DeviceBindingStep: React.FC<DeviceBindingStepProps> = ({ onFinish }) => {
  const {
    biometricsEnabled,
    locationGranted,
    setBiometrics,
    setLocationPermission,
    setStep,
  } = useAuthStore();

  const [localBio, setLocalBio] = useState(biometricsEnabled);
  const [localLoc, setLocalLoc] = useState(locationGranted);

  const handleToggleBio = async (val: boolean) => {
    setLocalBio(val);
    setBiometrics(val);

    if (val && Platform.OS !== 'web') {
      try {
        const LocalAuthentication = require('expo-local-authentication');
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (hasHardware) {
          await LocalAuthentication.authenticateAsync({
            promptMessage: 'Enable Biometric Quick-Unlock for PolyFit Pass',
          });
        }
      } catch (e) {
        console.warn('[Biometrics] Note:', e);
      }
    }
  };

  const handleToggleLoc = async (val: boolean) => {
    setLocalLoc(val);
    setLocationPermission(val);

    if (val && Platform.OS !== 'web') {
      try {
        const Location = require('expo-location');
        await Location.requestForegroundPermissionsAsync();
      } catch (e) {
        console.warn('[Location] Note:', e);
      }
    }
  };

  const handleComplete = () => {
    setStep('completed');
    onFinish();
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>P</Text>
          </View>
          <Text style={styles.brandTitle}>
            POLY<Text style={{ color: Palette.green }}>FIT</Text>
          </Text>
        </View>

        <View style={styles.readyBadge}>
          <ShieldCheck size={14} color={Palette.green} />
          <Text style={styles.readyText}>READY</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentBody}>
        {/* Title */}
        <View style={styles.headerBlock}>
          <Text style={styles.screenTitle}>Pass Provisioned!</Text>
          <Text style={styles.screenSubtitle}>
            Your cryptographic pass is securely bound to this device. Choose your preferences for check-in:
          </Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {/* Biometrics Toggle Card */}
          <View style={styles.optionCard}>
            <View style={styles.iconCircle}>
              <Fingerprint size={22} color={Palette.green} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Biometric Quick-Unlock</Text>
              <Text style={styles.optionDesc}>
                Open pass instantly with FaceID / fingerprint at reception.
              </Text>
            </View>
            <Switch
              value={localBio}
              onValueChange={handleToggleBio}
              trackColor={{ false: '#1E293B', true: Palette.green }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Location Permission Card */}
          <View style={styles.optionCard}>
            <View style={styles.iconCircle}>
              <MapPin size={22} color={Palette.teal} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Nearby Turnstile Detection</Text>
              <Text style={styles.optionDesc}>
                Auto-suggest facilities when you arrive at partner gyms.
              </Text>
            </View>
            <Switch
              value={localLoc}
              onValueChange={handleToggleLoc}
              trackColor={{ false: '#1E293B', true: Palette.green }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Lock size={14} color={Palette.teal} />
          <Text style={styles.privacyText}>
            PolyFit never tracks or sells personal movement data. Location is strictly used for reception check-in verification.
          </Text>
        </View>
      </View>

      {/* Bottom Pinned Action Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleComplete}
        >
          <View style={styles.continueButtonContent}>
            <Text style={styles.continueButtonText}>Open My Digital Pass</Text>
            <ArrowRight size={18} color="#0B1F33" />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#071521',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#0B1F33',
    fontWeight: '900',
    fontSize: 16,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyText: {
    color: Palette.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  contentBody: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.four,
  },
  headerBlock: {
    marginBottom: Spacing.five,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    color: Palette.textSecondary,
    lineHeight: 22,
  },

  optionsList: {
    gap: 12,
    marginBottom: Spacing.four,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2235',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.three,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#071521',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: Palette.textMuted,
    lineHeight: 16,
  },

  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 210, 180, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    color: Palette.teal,
    lineHeight: 15,
  },

  bottomBar: {
    gap: 10,
  },
  continueButton: {
    height: 54,
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(40, 209, 124, 0.35)',
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#0B1F33',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts?.sans,
  },
});
