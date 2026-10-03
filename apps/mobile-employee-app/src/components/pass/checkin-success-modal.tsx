/**
 * PolyFit Corporate Employee App - Check-in Confirmation & Celebration Modal
 * Strictly matches Stitch Design System ("Kiosk - Check-in Success")
 * Pulsing concentric halo rings, tactile haptics, and visit receipt card
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import {
  CheckCircle2,
  Building2,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

interface CheckinSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  facilityName: string;
  facilityNeighborhood?: string;
  employeeName: string;
  orgName: string;
  remainingVisits: number | string;
  verifiedAt?: string;
  isOfflineSync?: boolean;
}

export const CheckinSuccessModal: React.FC<CheckinSuccessModalProps> = ({
  visible,
  onClose,
  facilityName,
  facilityNeighborhood = 'Kiyovu, Kigali',
  employeeName,
  orgName,
  remainingVisits,
  verifiedAt,
  isOfflineSync = false,
}) => {
  // Trigger tactile haptics on modal display
  useEffect(() => {
    if (visible) {
      try {
        if (Platform.OS !== 'web') {
          const Haptics = require('expo-haptics');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        // graceful fallback on web
      }
    }
  }, [visible]);

  const displayTime = verifiedAt
    ? new Date(verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.cardContainer}>
          {/* Pulsing Concentric Green Halo */}
          <View style={styles.haloOuterRing}>
            <View style={styles.haloInnerRing}>
              <View style={styles.iconCircle}>
                <CheckCircle2 size={48} color="#0B1F33" strokeWidth={2.5} />
              </View>
            </View>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>Access Granted</Text>
          <Text style={styles.subheadline}>
            Welcome back to {facilityName}
          </Text>

          {/* Receipt Card */}
          <View style={styles.receiptCard}>
            {/* Beneficiary Header */}
            <View style={styles.beneficiaryHeader}>
              <View>
                <Text style={styles.beneficiaryName}>{employeeName}</Text>
                <View style={styles.orgRow}>
                  <Building2 size={13} color={Palette.teal} />
                  <Text style={styles.orgName}>{orgName}</Text>
                </View>
              </View>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color={Palette.green} />
                <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
              </View>
            </View>

            {/* Visit Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View style={styles.detailLabelRow}>
                  <Clock size={12} color={Palette.textMuted} />
                  <Text style={styles.detailLabel}>Check-In Time</Text>
                </View>
                <Text style={styles.detailValue}>Today, {displayTime}</Text>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailLabelRow}>
                  <MapPin size={12} color={Palette.textMuted} />
                  <Text style={styles.detailLabel}>Facility</Text>
                </View>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {facilityNeighborhood}
                </Text>
              </View>
            </View>

            {/* Remaining Monthly Allowance Banner */}
            <View style={styles.quotaPill}>
              <Sparkles size={14} color={Palette.green} />
              <Text style={styles.quotaText}>
                {isOfflineSync
                  ? 'Offline Verified • Queued for Sync'
                  : `${remainingVisits} visits remaining this month`}
              </Text>
            </View>
          </View>

          {/* Dismiss Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.doneBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 33, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },

  haloOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  haloInnerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(40, 209, 124, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.green,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 30px rgba(40, 209, 124, 0.5)',
  },

  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.green,
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheadline: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: Spacing.four,
    textAlign: 'center',
  },

  receiptCard: {
    width: '100%',
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: Spacing.four,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    marginBottom: Spacing.four,
  },
  beneficiaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: Spacing.three,
    marginBottom: Spacing.three,
  },
  beneficiaryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  orgName: {
    fontSize: 12,
    color: Palette.teal,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.green,
  },

  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.three,
  },
  detailItem: {
    flex: 1,
    backgroundColor: '#0D2235',
    borderRadius: Radius.sm,
    padding: Spacing.two,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: Palette.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    borderRadius: Radius.btn,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.25)',
  },
  quotaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.green,
  },

  doneBtn: {
    width: '100%',
    height: 48,
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 16px rgba(40, 209, 124, 0.35)',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B1F33', // Midnight Navy on Electric Green (contrast rule)
  },
});
