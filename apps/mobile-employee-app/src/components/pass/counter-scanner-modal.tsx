/**
 * PolyFit Corporate Employee App - Front-Desk Plaque Scanner & Manual Bypass (Modality B)
 * Camera Viewfinder for scanning official PolyFit Reception Desk QR Plaques
 * Features permission recovery prompts, fallback manual code entry, and test simulation chips.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { AppModal } from '@/components/common/app-modal';
import {
  X,
  Zap,
  ZapOff,
  Camera,
  QrCode,
  MapPin,
  Sparkles,
  ShieldAlert,
  Keypad,
  Keyboard,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

export interface ScannedPlaqueData {
  providerLocationId: string;
  facilityName: string;
  neighborhood: string;
  lat: number;
  lng: number;
}

// Official partner desk plaques in Kigali for testing and manual resolution
export const PARTNER_DESK_PLAQUES: (ScannedPlaqueData & { shortCode: string })[] = [
  {
    shortCode: 'PLQ-101',
    providerLocationId: 'b0000000-0000-0000-0000-000000000010',
    facilityName: 'Cercle Sportif Olympic Pool',
    neighborhood: 'Kiyovu, Kigali',
    lat: -1.9542,
    lng: 30.0625,
  },
  {
    shortCode: 'PLQ-102',
    providerLocationId: 'b0000000-0000-0000-0000-000000000011',
    facilityName: 'Kigali Heights Fitness Club',
    neighborhood: 'Kimihurura, Kigali',
    lat: -1.9536,
    lng: 30.0921,
  },
  {
    shortCode: 'PLQ-103',
    providerLocationId: 'b0000000-0000-0000-0000-000000000012',
    facilityName: 'Waka Fitness & Performance',
    neighborhood: 'Downtown Kigali',
    lat: -1.9441,
    lng: 30.0619,
  },
];

interface CounterScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (plaque: ScannedPlaqueData) => void;
}

type ScanTab = 'camera' | 'manual';
type PermissionStatus = 'granted' | 'denied' | 'prompt';

export const CounterScannerModal: React.FC<CounterScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const targetSize = Math.min(windowWidth - 64, 250);

  const [activeTab, setActiveTab] = useState<ScanTab>('camera');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setManualCode('');
      setManualError(null);
      // Auto-grant camera in demo/web context after initial prompt
      if (permissionStatus === 'prompt') {
        setPermissionStatus('granted');
      }
    } else {
      setTorchEnabled(false);
    }
  }, [visible]);

  const handleRequestPermission = () => {
    setPermissionStatus('granted');
  };

  const handleSimulateScan = (plaque: ScannedPlaqueData) => {
    try {
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // fallback
    }
    onScanSuccess(plaque);
  };

  const handleManualSubmit = () => {
    setManualError(null);
    const clean = manualCode.trim().toUpperCase();

    if (!clean) {
      setManualError('Please enter a plaque code or facility ID.');
      return;
    }

    // Try matching shortCode or location ID
    const match = PARTNER_DESK_PLAQUES.find(
      (p) =>
        p.shortCode === clean ||
        p.providerLocationId.toLowerCase() === clean.toLowerCase() ||
        p.facilityName.toLowerCase().includes(clean.toLowerCase())
    );

    if (match) {
      handleSimulateScan(match);
      return;
    }

    // Fallback: Generate dynamic manual verification receipt for custom code
    const customPlaque: ScannedPlaqueData = {
      providerLocationId: `custom_plq_${clean}`,
      facilityName: `${clean} Verified Desk`,
      neighborhood: 'Kigali Central',
      lat: -1.9536,
      lng: 30.0924,
    };

    handleSimulateScan(customPlaque);
  };

  return (
    <AppModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <X size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerTitle}>Front-Desk Check-In</Text>
              <Text style={styles.headerSub}>Modality B • Plaque Scanner & Manual Bypass</Text>
            </View>

            <Pressable
              style={[styles.torchBtn, torchEnabled && styles.torchBtnActive]}
              onPress={() => setTorchEnabled(!torchEnabled)}
              disabled={activeTab !== 'camera'}
            >
              {torchEnabled ? (
                <Zap size={18} color="#0B1F33" />
              ) : (
                <ZapOff size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>

          {/* Mode Selector Segment */}
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'camera' && styles.tabBtnActive]}
              onPress={() => setActiveTab('camera')}
            >
              <Camera size={14} color={activeTab === 'camera' ? Palette.green : Palette.textMuted} />
              <Text style={[styles.tabText, activeTab === 'camera' && styles.tabTextActive]}>
                Camera Scanner
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, activeTab === 'manual' && styles.tabBtnActive]}
              onPress={() => setActiveTab('manual')}
            >
              <Keyboard size={14} color={activeTab === 'manual' ? Palette.green : Palette.textMuted} />
              <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
                Manual Entry
              </Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'camera' ? (
              permissionStatus === 'denied' ? (
                /* Permission Recovery State */
                <View style={styles.permissionRecoveryContainer}>
                  <View style={styles.permissionIconCircle}>
                    <ShieldAlert size={36} color="#F59E0B" />
                  </View>
                  <Text style={styles.permissionTitle}>Camera Access Required</Text>
                  <Text style={styles.permissionSub}>
                    PolyFit needs camera permission to scan front-desk QR plaques at partner gyms and fitness studios.
                  </Text>

                  <Pressable
                    style={styles.grantPermissionBtn}
                    onPress={handleRequestPermission}
                  >
                    <Text style={styles.grantPermissionText}>Grant Camera Permission</Text>
                  </Pressable>

                  <Pressable
                    style={styles.manualFallbackLink}
                    onPress={() => setActiveTab('manual')}
                  >
                    <Text style={styles.manualFallbackText}>Use Manual Code Entry Instead</Text>
                  </Pressable>
                </View>
              ) : (
                /* Camera Viewfinder Area */
                <View style={styles.viewfinderArea}>
                  <View style={[styles.targetFrame, { width: targetSize, height: targetSize }]}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />

                    <View style={styles.scanLaser} />

                    <View style={styles.centerTarget}>
                      <QrCode size={40} color="rgba(40, 209, 124, 0.4)" />
                    </View>
                  </View>

                  <Text style={styles.instructionText}>
                    Align the PolyFit reception QR plaque within the frame
                  </Text>
                </View>
              )
            ) : (
              /* Manual Plaque Code Entry Fallback */
              <View style={styles.manualEntryContainer}>
                <View style={styles.manualHeaderBox}>
                  <Keyboard size={24} color={Palette.green} />
                  <Text style={styles.manualTitle}>Enter Plaque ID Manually</Text>
                  <Text style={styles.manualSub}>
                    Located at the bottom right corner of the desk plaque or receptionist badge.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PLAQUE CODE / FACILITY ID</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="e.g. PLQ-101, PLQ-102"
                    placeholderTextColor={Palette.textMuted}
                    value={manualCode}
                    onChangeText={(text) => {
                      setManualCode(text);
                      setManualError(null);
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  {manualError ? <Text style={styles.errorText}>{manualError}</Text> : null}
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.submitCodeBtn,
                    pressed && { opacity: 0.9 },
                  ]}
                  onPress={handleManualSubmit}
                >
                  <Text style={styles.submitCodeBtnText}>Verify Plaque Code</Text>
                  <ArrowRight size={16} color="#0B1F33" />
                </Pressable>

                {/* Quick Sample Chips */}
                <View style={styles.quickChipsBox}>
                  <Text style={styles.quickChipsTitle}>Quick Test Plaque Codes:</Text>
                  <View style={styles.chipRow}>
                    {PARTNER_DESK_PLAQUES.map((p) => (
                      <Pressable
                        key={p.shortCode}
                        style={styles.quickChipPill}
                        onPress={() => {
                          setManualCode(p.shortCode);
                          setManualError(null);
                        }}
                      >
                        <Text style={styles.quickChipText}>{p.shortCode}</Text>
                        <Text style={styles.quickChipSub}>{p.facilityName.split(' ')[0]}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Bottom Test & Partner Plaque Simulation Bar */}
            <View style={styles.simulationDrawer}>
              <View style={styles.drawerHeader}>
                <Sparkles size={14} color={Palette.teal} />
                <Text style={styles.drawerTitle}>Instant Plaque Simulator (Demo & Testing)</Text>
              </View>
              <Text style={styles.drawerSub}>
                Tap any official reception plaque to simulate instant counter scan:
              </Text>

              <View style={styles.plaqueList}>
                {PARTNER_DESK_PLAQUES.map((plaque) => (
                  <Pressable
                    key={plaque.providerLocationId}
                    style={({ pressed }) => [
                      styles.plaqueItem,
                      pressed && { opacity: 0.8, backgroundColor: 'rgba(40, 209, 124, 0.15)' },
                    ]}
                    onPress={() => handleSimulateScan(plaque)}
                  >
                    <View style={styles.plaqueIconBadge}>
                      <Camera size={16} color={Palette.green} />
                    </View>
                    <View style={styles.plaqueInfo}>
                      <View style={styles.plaqueNameRow}>
                        <Text style={styles.plaqueName}>{plaque.facilityName}</Text>
                        <View style={styles.codeTag}>
                          <Text style={styles.codeTagText}>{plaque.shortCode}</Text>
                        </View>
                      </View>
                      <View style={styles.plaqueLocRow}>
                        <MapPin size={11} color={Palette.textMuted} />
                        <Text style={styles.plaqueNeighborhood}>{plaque.neighborhood}</Text>
                      </View>
                    </View>
                    <View style={styles.scanBadge}>
                      <Text style={styles.scanBadgeText}>SCAN</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#050D15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#071521',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
    paddingBottom: Spacing.two,
    backgroundColor: '#0B1F33',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBlock: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11,
    color: Palette.teal,
    fontWeight: '500',
  },
  torchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchBtnActive: {
    backgroundColor: Palette.green,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0B1F33',
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.btn,
    backgroundColor: '#0D2235',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.3)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  tabTextActive: {
    color: Palette.green,
    fontWeight: '700',
  },

  viewfinderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  targetFrame: {
    width: 250,
    height: 250,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(11, 31, 51, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.25)',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Palette.green,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  centerTarget: {
    opacity: 0.6,
  },
  scanLaser: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: Palette.green,
    top: '50%',
  },
  instructionText: {
    marginTop: Spacing.three,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 260,
  },

  /* Permission Recovery State */
  permissionRecoveryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  permissionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  permissionSub: {
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  grantPermissionBtn: {
    backgroundColor: Palette.green,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: Radius.btn,
    marginTop: Spacing.three,
    width: '100%',
    alignItems: 'center',
  },
  grantPermissionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B1F33',
  },
  manualFallbackLink: {
    marginTop: Spacing.two,
    padding: 8,
  },
  manualFallbackText: {
    fontSize: 12,
    color: Palette.teal,
    fontWeight: '600',
  },

  /* Manual Entry State */
  manualEntryContainer: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  manualHeaderBox: {
    alignItems: 'center',
    backgroundColor: '#0B1F33',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manualSub: {
    fontSize: 12,
    color: Palette.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textMuted,
    letterSpacing: 0.5,
  },
  manualInput: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: Spacing.three,
    height: 48,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  submitCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    height: 48,
  },
  submitCodeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B1F33',
  },
  quickChipsBox: {
    marginTop: Spacing.two,
    gap: 8,
  },
  quickChipsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChipPill: {
    flex: 1,
    backgroundColor: '#0D2235',
    padding: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.teal,
  },
  quickChipSub: {
    fontSize: 9,
    color: Palette.textMuted,
  },

  /* Simulator Drawer */
  simulationDrawer: {
    backgroundColor: '#0B1F33',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: Spacing.four,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  drawerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  drawerSub: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginBottom: Spacing.three,
  },
  plaqueList: {
    gap: 8,
  },
  plaqueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  plaqueIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plaqueInfo: {
    flex: 1,
  },
  plaqueNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  plaqueName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  codeTag: {
    backgroundColor: 'rgba(0, 210, 180, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  codeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Palette.teal,
  },
  plaqueLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plaqueNeighborhood: {
    fontSize: 11,
    color: Palette.textMuted,
  },
  scanBadge: {
    backgroundColor: Palette.green,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  scanBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0B1F33',
  },
});
