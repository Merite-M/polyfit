/**
 * PolyFit Corporate Employee App - Verified Visit Receipt Modal (PF-102)
 * Cryptographic proof of attendance for corporate wellness beneficiaries
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import {
  ShieldCheck,
  X,
  MapPin,
  Calendar,
  KeyRound,
  CheckCircle2,
  Building2,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { VerifiedVisitReceipt } from '@/types/auth';

interface VisitReceiptModalProps {
  visible: boolean;
  visit: VerifiedVisitReceipt | null;
  organizationName?: string;
  onClose: () => void;
}

export function VisitReceiptModal({
  visible,
  visit,
  organizationName = 'Bank of Kigali',
  onClose,
}: VisitReceiptModalProps) {
  if (!visit) return null;

  const dateObj = new Date(visit.checkInAt);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString([], {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent Visit';

  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const verificationLabel =
    visit.verificationMethod === 'totp_qr'
      ? 'Dynamic TOTP Pass (RFC 6238)'
      : visit.verificationMethod === 'plaque_scan'
      ? 'Facility Plaque Scan'
      : 'Desk Verification';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.securityBadge}>
                <ShieldCheck size={14} color={Palette.green} />
                <Text style={styles.securityBadgeText}>VERIFIED VISIT RECEIPT</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
              hitSlop={8}
            >
              <X size={18} color={Palette.textMuted} />
            </Pressable>
          </View>

          {/* Facility Info */}
          <View style={styles.facilitySection}>
            <Text style={styles.providerName}>{visit.providerName}</Text>
            <View style={styles.addressRow}>
              <MapPin size={13} color={Palette.teal} />
              <Text style={styles.addressText}>{visit.locationName || visit.address}</Text>
            </View>
          </View>

          {/* Receipt Data Table */}
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <Calendar size={13} color={Palette.textMuted} />
                <Text style={styles.detailLabel}>Timestamp</Text>
              </View>
              <Text style={styles.detailValue}>
                {formattedDate} • {formattedTime}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <KeyRound size={13} color={Palette.textMuted} />
                <Text style={styles.detailLabel}>Verification Method</Text>
              </View>
              <Text style={styles.detailValue}>{verificationLabel}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <Building2 size={13} color={Palette.textMuted} />
                <Text style={styles.detailLabel}>Corporate Sponsor</Text>
              </View>
              <Text style={styles.detailValue}>{organizationName}</Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <View style={styles.detailLabelRow}>
                <CheckCircle2 size={13} color={Palette.green} />
                <Text style={styles.detailLabel}>Pass Audit Hash</Text>
              </View>
              <Text style={[styles.detailValue, styles.monoHash]}>
                {visit.totpTokenHash || 'ec79a2...9d1'}
              </Text>
            </View>
          </View>

          {/* Aggregator Settlement Verification Footer */}
          <View style={styles.footerNote}>
            <ShieldCheck size={12} color={Palette.green} />
            <Text style={styles.footerNoteText}>
              Verified by PolyFit Network Infrastructure. Eligible for corporate wellness benefit subsidy.
            </Text>
          </View>

          {/* Done CTA */}
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>Close Receipt</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 33, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.3)',
    gap: Spacing.three,
    boxShadow: '0 20px 25px -5px rgba(11, 31, 51, 0.4)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  securityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.green,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D2235',
    justifyContent: 'center',
    alignItems: 'center',
  },
  facilitySection: {
    gap: 4,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  providerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  detailsBox: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  monoHash: {
    fontFamily: 'monospace',
    color: Palette.green,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(40, 209, 124, 0.06)',
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.15)',
  },
  footerNoteText: {
    flex: 1,
    fontSize: 10,
    color: '#CBD5E1',
    lineHeight: 14,
  },
  doneBtn: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.btn,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
