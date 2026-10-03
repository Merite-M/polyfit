/**
 * PolyFit Corporate Employee App - Pre-Check Verification Status Banners
 * Displays Geofence warnings (200m), Anti-Passback cooldowns (30m), and Quota exhaustion alerts
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  MapPinOff,
  Clock,
  AlertCircle,
  WifiOff,
  ShieldCheck,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

interface PassVerificationStatusProps {
  isOutOfGeofence?: boolean;
  distanceMeters?: number;
  targetFacilityName?: string;
  inCooldown?: boolean;
  cooldownRemainingSeconds?: number;
  isQuotaExhausted?: boolean;
  usedVisits?: number;
  maxVisits?: number;
  resetDate?: string;
  isOffline?: boolean;
}

export const PassVerificationStatus: React.FC<PassVerificationStatusProps> = ({
  isOutOfGeofence,
  distanceMeters = 450,
  targetFacilityName = 'Cercle Sportif Olympic Pool',
  inCooldown,
  cooldownRemainingSeconds = 0,
  isQuotaExhausted,
  usedVisits = 12,
  maxVisits = 12,
  resetDate = 'Nov 1',
  isOffline,
}) => {
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <View style={styles.container}>
      {/* 1. Geofence Out-of-Bounds Warning */}
      {isOutOfGeofence && (
        <View style={styles.geofenceBanner}>
          <MapPinOff size={18} color="#F59E0B" />
          <View style={styles.bannerTextCol}>
            <Text style={styles.geofenceTitle}>Outside Facility Geofence</Text>
            <Text style={styles.geofenceSub}>
              You are {distanceMeters}m away from {targetFacilityName}. Maximum access radius is 200m.
            </Text>
          </View>
        </View>
      )}

      {/* 2. Anti-Passback Cooldown Active */}
      {inCooldown && (
        <View style={styles.cooldownBanner}>
          <Clock size={18} color={Palette.teal} />
          <View style={styles.bannerTextCol}>
            <Text style={styles.cooldownTitle}>Re-entry Cooldown Active</Text>
            <Text style={styles.cooldownSub}>
              Previous visit verified. Next check-in unlocks in{' '}
              <Text style={styles.monoHighlight}>
                {formatSeconds(cooldownRemainingSeconds)}
              </Text>
            </Text>
          </View>
        </View>
      )}

      {/* 3. Monthly Allowance Reached (Quota Exhausted) */}
      {isQuotaExhausted && (
        <View style={styles.quotaBanner}>
          <AlertCircle size={18} color="#FF5A65" />
          <View style={styles.bannerTextCol}>
            <Text style={styles.quotaTitle}>Monthly Allowance Reached</Text>
            <Text style={styles.quotaSub}>
              You have utilized all {usedVisits}/{maxVisits} corporate visits for this billing cycle. Next refresh on {resetDate}.
            </Text>
          </View>
        </View>
      )}

      {/* 4. Offline Vault Active (Basement Safe) */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineIconRow}>
            <WifiOff size={14} color={Palette.green} />
            <ShieldCheck size={14} color={Palette.green} />
          </View>
          <Text style={styles.offlineText}>
            Offline Vault Active • 100% Cryptographic On-Device TOTP
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: Spacing.two,
  },
  geofenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  bannerTextCol: {
    flex: 1,
  },
  geofenceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 2,
  },
  geofenceSub: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },

  cooldownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 210, 180, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 180, 0.35)',
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  cooldownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.teal,
    marginBottom: 2,
  },
  cooldownSub: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  monoHighlight: {
    fontWeight: '800',
    color: Palette.green,
  },

  quotaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 90, 101, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 101, 0.35)',
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  quotaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5A65',
    marginBottom: 2,
  },
  quotaSub: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(40, 209, 124, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.2)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  offlineIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.green,
  },
});
