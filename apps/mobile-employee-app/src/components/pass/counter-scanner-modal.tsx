/**
 * PolyFit Corporate Employee App - In-App Counter Scanner (Modality B)
 * Camera Viewfinder for scanning official PolyFit Reception Desk QR Plaques
 * Features cross-platform camera preview, scanning reticle, torch toggle, and partner simulation chips
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  X,
  Zap,
  ZapOff,
  Camera,
  QrCode,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

export interface ScannedPlaqueData {
  providerLocationId: string;
  facilityName: string;
  neighborhood: string;
  lat: number;
  lng: number;
}

// Sample official partner desk plaques in Kigali for testing
export const PARTNER_DESK_PLAQUES: ScannedPlaqueData[] = [
  {
    providerLocationId: 'b0000000-0000-0000-0000-000000000010',
    facilityName: 'Cercle Sportif Olympic Pool',
    neighborhood: 'Kiyovu, Kigali',
    lat: -1.9542,
    lng: 30.0625,
  },
  {
    providerLocationId: 'b0000000-0000-0000-0000-000000000011',
    facilityName: 'Kigali Heights Fitness Club',
    neighborhood: 'Kimihurura, Kigali',
    lat: -1.9536,
    lng: 30.0921,
  },
  {
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

export const CounterScannerModal: React.FC<CounterScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const targetSize = Math.min(windowWidth - 64, 250);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsScanning(true);
    } else {
      setIsScanning(false);
      setTorchEnabled(false);
    }
  }, [visible]);

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Scan Desk Plaque</Text>
            <Text style={styles.headerSub}>Modality B • Reception Check-In</Text>
          </View>
          <Pressable
            style={[styles.torchBtn, torchEnabled && styles.torchBtnActive]}
            onPress={() => setTorchEnabled(!torchEnabled)}
          >
            {torchEnabled ? (
              <Zap size={18} color="#0B1F33" />
            ) : (
              <ZapOff size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Viewfinder Area */}
          <View style={styles.viewfinderArea}>
            {/* Target Reticle Frame */}
            <View style={[styles.targetFrame, { width: targetSize, height: targetSize }]}>
            {/* 4 Corner Crosshairs */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Scanning Laser Line */}
            <View style={styles.scanLaser} />

            <View style={styles.centerTarget}>
              <QrCode size={40} color="rgba(40, 209, 124, 0.4)" />
            </View>
          </View>

          <Text style={styles.instructionText}>
            Align the PolyFit reception QR plaque within the frame
          </Text>
        </View>

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
                  <Text style={styles.plaqueName}>{plaque.facilityName}</Text>
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
    </Modal>
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
    paddingBottom: Spacing.three,
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

  viewfinderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
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
    boxShadow: '0 0 40px rgba(0, 0, 0, 0.6)',
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
    boxShadow: '0 0 12px #28D17C',
    top: '50%',
  },
  instructionText: {
    marginTop: Spacing.four,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 260,
  },

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
  plaqueName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
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
    color: '#0B1F33', // Midnight Navy on Electric Green
  },
});
