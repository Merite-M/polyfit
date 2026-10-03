/**
 * PolyFit Corporate Employee App - Demo & Testing Simulation Toolbar
 * Enables 1-tap toggling of geofence bounds, anti-passback cooldowns, quota limits, and offline mode
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  SlidersHorizontal,
  MapPin,
  Clock,
  BatteryCharging,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

interface DemoSimulationBarProps {
  isOutOfGeofence: boolean;
  onToggleGeofence: () => void;
  inCooldown: boolean;
  onToggleCooldown: () => void;
  isQuotaExhausted: boolean;
  onToggleQuota: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export const DemoSimulationBar: React.FC<DemoSimulationBarProps> = ({
  isOutOfGeofence,
  onToggleGeofence,
  inCooldown,
  onToggleCooldown,
  isQuotaExhausted,
  onToggleQuota,
  isOffline,
  onToggleOffline,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.toggleHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <SlidersHorizontal size={14} color={Palette.teal} />
          <Text style={styles.headerTitle}>Developer & Co-founder Simulator</Text>
        </View>
        {expanded ? (
          <ChevronUp size={16} color={Palette.textMuted} />
        ) : (
          <ChevronDown size={16} color={Palette.textMuted} />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.controlsBody}>
          <Text style={styles.instructions}>
            Toggle edge cases to test acceptance criteria live on device:
          </Text>

          <View style={styles.chipRow}>
            {/* Geofence Toggle */}
            <Pressable
              style={[styles.chip, isOutOfGeofence && styles.chipWarning]}
              onPress={onToggleGeofence}
            >
              <MapPin size={12} color={isOutOfGeofence ? '#F59E0B' : Palette.textMuted} />
              <Text
                style={[
                  styles.chipText,
                  isOutOfGeofence && { color: '#F59E0B', fontWeight: '700' },
                ]}
              >
                {isOutOfGeofence ? 'Geofence: 450m (Out)' : 'Geofence: 50m (In)'}
              </Text>
            </Pressable>

            {/* Cooldown Toggle */}
            <Pressable
              style={[styles.chip, inCooldown && styles.chipTeal]}
              onPress={onToggleCooldown}
            >
              <Clock size={12} color={inCooldown ? Palette.teal : Palette.textMuted} />
              <Text
                style={[
                  styles.chipText,
                  inCooldown && { color: Palette.teal, fontWeight: '700' },
                ]}
              >
                {inCooldown ? 'Cooldown: 14m Left' : 'Cooldown: Inactive'}
              </Text>
            </Pressable>

            {/* Quota Exhausted Toggle */}
            <Pressable
              style={[styles.chip, isQuotaExhausted && styles.chipDanger]}
              onPress={onToggleQuota}
            >
              <BatteryCharging size={12} color={isQuotaExhausted ? '#FF5A65' : Palette.textMuted} />
              <Text
                style={[
                  styles.chipText,
                  isQuotaExhausted && { color: '#FF5A65', fontWeight: '700' },
                ]}
              >
                {isQuotaExhausted ? 'Quota: 12/12 Used' : 'Quota: 8 Left'}
              </Text>
            </Pressable>

            {/* Airplane / Offline Toggle */}
            <Pressable
              style={[styles.chip, isOffline && styles.chipGreen]}
              onPress={onToggleOffline}
            >
              {isOffline ? (
                <WifiOff size={12} color={Palette.green} />
              ) : (
                <Wifi size={12} color={Palette.textMuted} />
              )}
              <Text
                style={[
                  styles.chipText,
                  isOffline && { color: Palette.green, fontWeight: '700' },
                ]}
              >
                {isOffline ? 'Mode: Basement Offline' : 'Mode: Online'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  controlsBody: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  instructions: {
    fontSize: 11,
    color: Palette.textMuted,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#071521',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '500',
    color: Palette.textMuted,
  },
  chipWarning: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  chipTeal: {
    borderColor: 'rgba(0, 210, 180, 0.4)',
    backgroundColor: 'rgba(0, 210, 180, 0.1)',
  },
  chipDanger: {
    borderColor: 'rgba(255, 90, 101, 0.4)',
    backgroundColor: 'rgba(255, 90, 101, 0.1)',
  },
  chipGreen: {
    borderColor: 'rgba(40, 209, 124, 0.4)',
    backgroundColor: 'rgba(40, 209, 124, 0.1)',
  },
});
