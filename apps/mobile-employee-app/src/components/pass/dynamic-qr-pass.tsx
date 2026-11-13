/**
 * PolyFit Corporate Employee App - Tab 1: Hero Dynamic TOTP Access Pass (PF-101)
 * Upgraded to pure Reanimated 4 UI-thread worklets, Apple Wallet aesthetic,
 * "Hide Code" toggle (ClassPass/Wellhub inspired), and 100% offline vault resilience.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ShieldCheck,
  Building2,
  Clock,
  Camera,
  WifiOff,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
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
import { OfflineVaultService } from '@/services/offline-vault';

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

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

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
  const [vaultSeed, setVaultSeed] = useState<string | null>(null);
  const [isCodeHidden, setIsCodeHidden] = useState(false);

  // Reanimated 4 Shared Values for 60/120 FPS UI Thread Performance
  const progressRatio = useSharedValue(1);
  const shimmerTranslateY = useSharedValue(-25);

  // Retrieve seed from SecureStore vault if prop is missing
  useEffect(() => {
    if (!offlineSeed) {
      OfflineVaultService.getTokenSeed().then((stored) => {
        if (stored) setVaultSeed(stored);
      }).catch(() => {});
    }
  }, [offlineSeed]);

  // Anti-screenshot animated watermark shimmer loop on UI thread
  useEffect(() => {
    shimmerTranslateY.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-25, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // 30-second RFC 6238 TOTP rotation timer with smooth progress animation
  useEffect(() => {
    const updateTotp = () => {
      const now = Date.now();
      const rem = getClientSecondsRemaining(TOTP_STEP_SECONDS, now);
      setSecondsRemaining(rem);
      setLiveTimestamp(new Date(now).toLocaleTimeString());

      const activeSeed = offlineSeed || vaultSeed || 'polyfit_secure_totp_seed_2026_default';
      const rawCode = generateClientTotp(activeSeed, TOTP_STEP_SECONDS, now);
      setTotpCode(`${rawCode.slice(0, 3)} ${rawCode.slice(3)}`);

      const payload = createDynamicPassPayload({
        employeeId,
        token: rawCode,
        offline: isOffline,
      });
      setQrPayload(payload);

      // Smooth progress bar animation over exact remaining window
      const remMs = (rem * 1000) - (now % 1000);
      const ratio = rem / TOTP_STEP_SECONDS;
      progressRatio.value = ratio;
      progressRatio.value = withTiming(0, {
        duration: Math.max(0, remMs),
        easing: Easing.linear,
      });
    };

    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [employeeId, offlineSeed, vaultSeed, isOffline]);

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${Math.max(0, Math.min(100, progressRatio.value * 100))}%`,
    };
  });

  const animatedShimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: shimmerTranslateY.value }],
    };
  });

  const handleToggleCode = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setIsCodeHidden((prev) => !prev);
  };

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
          <View style={styles.beneficiaryCol}>
            <Text style={styles.beneficiaryLabel}>BENEFICIARY</Text>
            <Text style={styles.beneficiaryName} numberOfLines={1}>{employeeName}</Text>
            <Text style={styles.beneficiaryDept} numberOfLines={1}>{department}</Text>
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText} numberOfLines={1}>
              {tierName
                .replace(new RegExp(orgName, 'gi'), '')
                .replace(/Corporate Tier/gi, 'Standard')
                .replace(/Corporate/gi, '')
                .trim()
                ? `${tierName.replace(new RegExp(orgName, 'gi'), '').replace(/Corporate/gi, '').trim().toUpperCase()} TIER`
                : 'STANDARD TIER'}
            </Text>
          </View>
        </View>

        {/* Dynamic QR Pass Display Frame */}
        <View style={styles.qrFrameWrapper}>
          {/* Hide Code / Show Code Toggle Pill (ClassPass Screenshot Inspired) */}
          <Pressable
            style={styles.hideCodePill}
            onPress={handleToggleCode}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isCodeHidden ? 'Show Pass Code' : 'Hide Pass Code'}
          >
            {isCodeHidden ? (
              <>
                <Eye size={13} color="#0B1F33" />
                <Text style={styles.hideCodePillText}>Show Code</Text>
              </>
            ) : (
              <>
                <EyeOff size={13} color="#0B1F33" />
                <Text style={styles.hideCodePillText}>Hide Code</Text>
              </>
            )}
          </Pressable>

          <View style={styles.qrInnerBox}>
            {isCodeHidden ? (
              /* Privacy Masked Frame */
              <Pressable
                style={styles.hiddenMatrixPlaceholder}
                onPress={handleToggleCode}
                accessibilityRole="button"
                accessibilityLabel="Pass hidden. Tap to reveal QR code."
              >
                <View style={styles.hiddenLockIconCircle}>
                  <Lock size={28} color={Palette.teal} />
                </View>
                <Text style={styles.hiddenNoticeTitle}>Pass Hidden</Text>
                <Text style={styles.hiddenNoticeSub}>Tap to reveal QR</Text>
              </Pressable>
            ) : (
              /* High-Contrast Dynamic RFC 6238 QR Matrix */
              <>
                <QrCodeMatrix
                  value={qrPayload}
                  size={180}
                  color="#0B1F33"
                  backgroundColor="#FFFFFF"
                />

                {/* Anti-Screenshot Moving Shimmer Ribbon */}
                <Animated.View
                  style={[styles.antiScreenshotRibbon, animatedShimmerStyle]}
                  pointerEvents="none"
                >
                  <View style={styles.ribbonBar} />
                </Animated.View>
              </>
            )}
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

            {/* Large 6-Digit TOTP Code in Mono Font with Hide Masking */}
            <View style={styles.codeBlock}>
              <Text style={styles.totpLabel}>FRONT DESK ENTRY CODE</Text>
              <Text style={styles.totpCodeText}>
                {isCodeHidden ? '•••• ••••' : totpCode}
              </Text>
            </View>
          </View>

          {/* Linear Progress Bar for 30s Window (60/120 FPS Reanimated Worklet) */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                animatedProgressStyle,
                secondsRemaining <= 5 && { backgroundColor: '#FF5A65' },
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
                  : 'Rotating RFC 6238 TOTP (30s Window • Turnstile & Scanner Ready)'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Primary Modality B Action: Scan Partner Front Desk Plaque */}
      <Pressable
        style={({ pressed }) => [
          styles.scanPlaqueBtn,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
        onPress={onOpenScanner}
        accessibilityRole="button"
        accessibilityLabel="Scan desk plaque at partner facility"
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
    borderRadius: Radius.card,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 15,
        elevation: 8,
      },
    }),
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
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.three,
  },
  beneficiaryCol: {
    flex: 1,
    minWidth: 0,
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
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  qrFrameWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071521',
    borderRadius: Radius.card,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: Spacing.three,
    position: 'relative',
  },
  hideCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  hideCodePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B1F33',
  },
  qrInnerBox: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: Radius.card,
    overflow: 'hidden',
    width: 196,
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenMatrixPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  hiddenLockIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 210, 180, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hiddenNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hiddenNoticeSub: {
    fontSize: 11,
    color: Palette.textMuted,
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
    flex: 1,
  },

  scanPlaqueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    padding: Spacing.three,
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(40, 209, 124, 0.3)',
      },
      default: {
        shadowColor: Palette.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
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
    flexShrink: 1,
  },
  scanBtnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B1F33',
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
    fontSize: 9,
    textAlign: 'center',
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
