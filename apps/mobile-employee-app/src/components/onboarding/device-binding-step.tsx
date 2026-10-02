/**
 * Digital Pass Provisioning & Device Binding Step (PF-105 Step 3)
 * Biometrics quick-unlock & transparent location permission setup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Palette, Radius, Spacing, Fonts, Shadows } from '@/constants/theme';
import { PolyFitBrandHeader } from './polyfit-brand-header';

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
    <View style={styles.container}>
      <PolyFitBrandHeader compact />

      <View style={styles.card}>
        {/* Status indicator */}
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Benefit Provisioned • Offline Vault Ready</Text>
        </View>

        <Text style={styles.title}>Secure Device Setup</Text>
        <Text style={styles.subtitle}>
          Configure instant biometric launch and nearby facility detection for frictionless check-ins.
        </Text>

        {/* Biometrics Toggle Card */}
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionIcon}>🔐</Text>
            <View style={styles.optionDetails}>
              <Text style={styles.optionTitle}>Biometric Quick-Unlock</Text>
              <Text style={styles.optionDesc}>
                Open your digital pass instantly with FaceID / TouchID without typing passwords.
              </Text>
            </View>
            <Switch
              value={localBio}
              onValueChange={handleToggleBio}
              trackColor={{ false: '#E2E8F0', true: Palette.green }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Location Permission Card */}
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionIcon}>📍</Text>
            <View style={styles.optionDetails}>
              <Text style={styles.optionTitle}>Nearby Facility Detection</Text>
              <Text style={styles.optionDesc}>
                PolyFit uses your location to show partner gyms within walking distance and verify entrance turnstiles.
              </Text>
            </View>
            <Switch
              value={localLoc}
              onValueChange={handleToggleLoc}
              trackColor={{ false: '#E2E8F0', true: Palette.green }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Security Assurance */}
        <View style={styles.securityBox}>
          <Text style={styles.securityText}>
            🔒 Your cryptographic TOTP pass key is stored in your device&rsquo;s native hardware SecureStore. Your personal biometric data never leaves your phone.
          </Text>
        </View>

        {/* Finish CTA */}
        <TouchableOpacity style={styles.finishButton} onPress={handleComplete} activeOpacity={0.88}>
          <Text style={styles.finishButtonText}>Open My Digital Pass →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: Spacing.four,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: Spacing.four,
    ...Shadows.card,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.greenSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: Spacing.two,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.green,
    marginRight: 6,
  },
  statusText: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.greenText,
  },
  title: {
    fontFamily: Fonts?.sans,
    fontSize: 20,
    fontWeight: '700',
    color: Palette.navy,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts?.sans,
    fontSize: 13,
    color: Palette.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  optionCard: {
    backgroundColor: Palette.canvas,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 22,
    marginRight: Spacing.three,
  },
  optionDetails: {
    flex: 1,
    marginRight: Spacing.two,
  },
  optionTitle: {
    fontFamily: Fonts?.sans,
    fontSize: 14,
    fontWeight: '700',
    color: Palette.navy,
    marginBottom: 2,
  },
  optionDesc: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    color: Palette.textMuted,
    lineHeight: 16,
  },
  securityBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.inner,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  securityText: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    color: Palette.textSecondary,
    lineHeight: 15,
  },
  finishButton: {
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  finishButtonText: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '700',
    color: Palette.navy, // STRICT CONTRAST: NAVY ON GREEN
  },
});
