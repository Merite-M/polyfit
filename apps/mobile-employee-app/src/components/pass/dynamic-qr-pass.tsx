/**
 * PolyFit Corporate Employee App - Tab 1: Hero Dynamic TOTP Access Pass (PF-101)
 * Compliant with Stitch Design Center, Apple HIG, Reanimated physics, and Offline Vault
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import {
  ShieldCheck,
  Building2,
  Clock,
  Camera,
  WifiOff,
  Maximize2,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { QrCodeMatrix } from '@/components/pass/qr-code-matrix';
import {
  generateClientTotp,
  getClientSecondsRemaining,
  createDynamicPassPayload,
  TOTP_STEP_SECONDS,
} from '@/services/totp';

interface DynamicQrPassProps {
  employeeId: string;
  employeeName: string;
  department?: string;
  orgName: string;
  orgDomain?: string;
  tierName: string;
  monthlyVisits: number;
  remainingVisits: number | string;
  isFullySponsored: boolean;
  offlineSeed: string | null;
  isOffline?: boolean;
  onOpenScanner: () => void;
}

export const DynamicQrPass: React.FC<DynamicQrPassProps> = ({
  employeeId,
  employeeName,
  department = 'Commercial Banking',
  orgName,
  orgDomain = 'bk.rw',
  tierName,
  monthlyVisits,
  remainingVisits,
  isFullySponsored,
  offlineSeed,
  isOffline = false,
  onOpenScanner,
}) => {
  const [totpCode, setTotpCode] = useState('782 914');
  const [qrPayload, setQrPayload] = useState('polyfit_pass_initial');
  const [secondsRemaining, setSecondsRemaining] = useState(TOTP_STEP_SECONDS);
  const [liveTimestamp, setLiveTimestamp] = useState(new Date().toLocaleTimeString());

  // Animation values for the anti-screenshot ripple
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Shimmer loop to break static screenshots
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  // 15-second RFC 6238 TOTP rotation timer
  useEffect(() => {
    const updateTotp = () => {
      const now = Date.now();
      const rem = getClientSecondsRemaining(TOTP_STEP_SECONDS, now);
      setSecondsRemaining(rem);
      setLiveTimestamp(new Date(now).toLocaleTimeString());

      const seed = offlineSeed || 'polyfit_secure_totp_seed_2026_default';
      const rawCode = generateClientTotp(seed, TOTP_STEP_SECONDS, now);
      setTotpCode(`${rawCode.slice(0, 3)} ${rawCode.slice(3)}`);

      const payload = createDynamicPassPayload({
        employeeId,
        token: rawCode,
        offline: isOffline,
      });
      setQrPayload(payload);
    };

    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [employeeId, offlineSeed, isOffline]);

  // Calculate circular progress angle
  const progressRatio = secondsRemaining / TOTP_STEP_SECONDS;
  const progressPercent = Math.round(progressRatio * 100);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  });

  return (
    <View style={styles.container}>
      {/* Apple Wallet Style Hero Pass Card */}
      <View style={styles.heroPassCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orgInfo}>
            <Building2 size={16} color={Palette.teal} />
            <Text style={styles.orgName}>{orgName}</Text>
            <View style={styles.domainChip}>
              <Text style={styles.domainChipText}>{orgDomain}</Text>
            </View>
          </View>
          <View style={styles.verifiedChip}>
            <ShieldCheck size={14} color={Palette.green} />
            <Text style={styles.verifiedChipText}>VERIFIED</Text>
          </View>
        </View>

        {/* Beneficiary Identity Row */}
        <View style={styles.beneficiaryRow}>
          <View>
            <Text style={styles.beneficiaryLabel}>BENEFICIARY</Text>
            <Text style={styles.beneficiaryName}>{employeeName}</Text>
            <Text style={styles.beneficiaryDept}>{department}</Text>
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{tierName}</Text>
          </View>
        </View>

        {/* Dynamic QR Pass Display Frame */}
        <View style={styles.qrFrameWrapper}>
          <View style={styles.qrInnerBox}>
            {/* The Dynamic RFC 6238 QR Matrix */}
            <QrCodeMatrix
              value={qrPayload}
              size={180}
              color="#0B1F33"
              backgroundColor="#FFFFFF"
            />

            {/* Anti-Screenshot Moving Shimmer Ribbon */}
            <Animated.View
              style={[
                styles.antiScreenshotRibbon,
                { transform: [{ translateY: shimmerTranslate }] },
              ]}
              pointerEvents="none"
            >
              <View style={styles.ribbonBar} />
            </Animated.View>
          </View>

          {/* Embedded Dynamic Anti-Screenshot Watermark */}
          <View style={styles.watermarkRow}>
            <Text style={styles.watermarkText} numberOfLines={1}>
              {employeeName} • {orgName} • {liveTimestamp}
            </Text>
          </View>
        </View>

        {/* Countdown Ring & Numeric Reception Code */}
        <View style={styles.codeContainer}>
          <View style={styles.timerMetaRow}>
            {/* Countdown Badge */}
            <View style={styles.countdownBadge}>
              <Clock size={13} color={Palette.green} />
              <Text style={styles.countdownNumber}>{secondsRemaining}s</Text>
              <Text style={styles.countdownSub}>window</Text>
            </View>

            {/* Large 6-Digit TOTP Code in Mono Font */}
            <View style={styles.codeBlock}>
              <Text style={styles.totpLabel}>RECEPTION ENTRY CODE</Text>
              <Text style={styles.totpCodeText}>{totpCode}</Text>
            </View>
          </View>

          {/* Linear Progress Bar for 15s Window */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${progressPercent}%` },
                secondsRemaining <= 3 && { backgroundColor: '#FF5A65' },
              ]}
            />
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.statusIndicatorRow}>
              {isOffline ? (
                <WifiOff size={13} color={Palette.teal} />
              ) : (
                <RefreshCw size={12} color={Palette.green} />
              )}
              <Text style={styles.statusNoticeText}>
                {isOffline
                  ? 'Cryptographic Vault Active (Basement Safe)'
                  : 'Rotating RFC 6238 TOTP (Turnstile & Scanner Ready)'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Primary Modality B Action: Scan Partner Reception Plaque */}
      <Pressable
        style={({ pressed }) => [
          styles.scanPlaqueBtn,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
        onPress={onOpenScanner}
      >
        <View style={styles.scanBtnIconCircle}>
          <Camera size={20} color="#0B1F33" />
        </View>
        <View style={styles.scanBtnTextCol}>
          <Text style={styles.scanBtnTitle}>Scan Desk Plaque</Text>
          <Text style={styles.scanBtnSub}>
            At studio or boutique desk without automated turnstile
          </Text>
        </View>
      </Pressable>

      {/* Quota & Allocation Summary Pill */}
      <View style={styles.quotaPillContainer}>
        <View style={styles.quotaPillItem}>
          <Text style={styles.quotaPillNum}>{monthlyVisits}</Text>
          <Text style={styles.quotaPillSub}>Monthly Visits</Text>
        </View>
        <View style={styles.quotaPillDivider} />
        <View style={styles.quotaPillItem}>
          <Text style={[styles.quotaPillNum, { color: Palette.green }]}>
            {remainingVisits}
          </Text>
          <Text style={styles.quotaPillSub}>Remaining</Text>
        </View>
        <View style={styles.quotaPillDivider} />
        <View style={styles.quotaPillItem}>
          <Text style={styles.quotaPillNum}>
            {isFullySponsored ? '0 RWF' : 'Co-Pay'}
          </Text>
          <Text style={styles.quotaPillSub}>Employee Cost</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  heroPassCard: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  domainChip: {
    backgroundColor: 'rgba(0, 210, 180, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  domainChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.teal,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedChipText: {
    color: Palette.green,
    fontSize: 10,
    fontWeight: '800',
  },

  beneficiaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  beneficiaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.textMuted,
    marginBottom: 2,
  },
  beneficiaryName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  beneficiaryDept: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 1,
  },
  tierBadge: {
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.green,
  },

  qrFrameWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071521',
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: Spacing.three,
  },
  qrInnerBox: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  antiScreenshotRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ribbonBar: {
    width: '120%',
    height: 12,
    backgroundColor: 'rgba(40, 209, 124, 0.18)',
    transform: [{ rotate: '-25deg' }],
  },
  watermarkRow: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  watermarkText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  codeContainer: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  timerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(40, 209, 124, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.green,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  countdownSub: {
    fontSize: 10,
    color: Palette.textMuted,
  },
  codeBlock: {
    alignItems: 'flex-end',
  },
  totpLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Palette.textMuted,
    letterSpacing: 0.5,
  },
  totpCodeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },

  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Palette.green,
    borderRadius: 2,
  },

  cardFooter: {
    paddingTop: 4,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusNoticeText: {
    fontSize: 11,
    color: Palette.textMuted,
  },

  scanPlaqueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    padding: Spacing.three,
    gap: 12,
    boxShadow: '0 4px 16px rgba(40, 209, 124, 0.3)',
  },
  scanBtnIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(11, 31, 51, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnTextCol: {
    flex: 1,
  },
  scanBtnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B1F33', // Midnight Navy on Electric Green (contrast rule)
    letterSpacing: -0.2,
  },
  scanBtnSub: {
    fontSize: 11,
    color: '#0B1F33',
    opacity: 0.8,
  },

  quotaPillContainer: {
    flexDirection: 'row',
    backgroundColor: '#0B1F33',
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quotaPillItem: {
    flex: 1,
    alignItems: 'center',
  },
  quotaPillNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  quotaPillSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textMuted,
    textTransform: 'uppercase',
  },
  quotaPillDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'center',
  },
});
