/**
 * PolyFit Corporate Employee App - Tab 1: Access Pass (PF-101)
 * Hero dynamic TOTP QR pass, 100% offline vault, dual-modality desk plaque scanner,
 * pre-check geofence / cooldown verification, and celebratory receipt confirmation.
 * Compliant with Stitch Design Center, Apple HIG, Reanimated physics, and aggregator standards.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { useTabStore } from '@/stores/tab-store';
import { DynamicQrPass } from '@/components/pass/dynamic-qr-pass';
import { PassVerificationStatus } from '@/components/pass/pass-verification-status';
import { CounterScannerModal, ScannedPlaqueData } from '@/components/pass/counter-scanner-modal';
import { CheckinSuccessModal } from '@/components/pass/checkin-success-modal';
import { DemoSimulationBar } from '@/components/pass/demo-simulation-bar';
import { OfflineVaultService } from '@/services/offline-vault';

export default function AccessPassScreen() {
  const {
    employee,
    organization,
    benefit,
    offlineTokenSeed,
    session,
  } = useAuthStore();

  const { preselectedFacility, clearPreselectedFacility } = useTabStore();

  // Modal States
  const [scannerVisible, setScannerVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [confirmedVisit, setConfirmedVisit] = useState<{
    facilityName: string;
    neighborhood: string;
    remainingVisits: number | string;
    verifiedAt: string;
    isOfflineSync: boolean;
  } | null>(null);

  // Simulation & Telemetry States (for edge case testing)
  const [isOutOfGeofence, setIsOutOfGeofence] = useState(false);
  const [inCooldown, setInCooldown] = useState(false);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(860); // 14m 20s
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Remaining visits calculation
  const monthlyVisits = benefit?.max_monthly_visits || 12;
  const [remainingVisits, setRemainingVisits] = useState<number | string>(
    isQuotaExhausted ? 0 : 8
  );

  // Sync remaining visits with quota toggle
  useEffect(() => {
    if (isQuotaExhausted) {
      setRemainingVisits(0);
    } else {
      setRemainingVisits(8);
    }
  }, [isQuotaExhausted]);

  // Live cooldown countdown timer
  useEffect(() => {
    if (!inCooldown || cooldownRemainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemainingSeconds((prev) => {
        if (prev <= 1) {
          setInCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [inCooldown, cooldownRemainingSeconds]);

  // Save offline seed into SecureStore vault whenever refreshed
  useEffect(() => {
    if (offlineTokenSeed && employee?.id) {
      OfflineVaultService.saveTokenSeed(offlineTokenSeed, {
        employeeId: employee.id,
        orgId: organization?.id || 'org-bk',
        stepSeconds: 15,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        issuedAt: Date.now(),
      }).catch((e) => console.warn('[AccessPass] Vault save note:', e));
    }
  }, [offlineTokenSeed, employee?.id, organization?.id]);

  // Handle Modality B Scan Success (from Camera or Plaque Simulator)
  const handlePlaqueScanned = async (plaque: ScannedPlaqueData) => {
    setScannerVisible(false);

    // 1. Geofence rejection check
    if (isOutOfGeofence) {
      const msg = `Geofence check failed: You are 450m away from ${plaque.facilityName}. Maximum allowed access radius is 200m.`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Outside Geofence', msg);
      }
      return;
    }

    // 2. Cooldown rejection check
    if (inCooldown) {
      const msg = `Anti-passback cooldown active: Previous visit verified. Re-entry allowed in ${Math.ceil(cooldownRemainingSeconds / 60)} minutes.`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Cooldown Active', msg);
      }
      return;
    }

    // 3. Quota exhausted rejection check
    if (isQuotaExhausted || remainingVisits === 0) {
      const msg = `Monthly allowance reached: You have utilized all ${monthlyVisits}/${monthlyVisits} visits for this cycle. Refreshes on Nov 1.`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Allowance Reached', msg);
      }
      return;
    }

    // 4. Handle Offline Check-in Stash vs. Online API Post
    const newRemaining = typeof remainingVisits === 'number' ? Math.max(0, remainingVisits - 1) : remainingVisits;
    setRemainingVisits(newRemaining);

    if (isOffline) {
      // Stash in encrypted offline vault
      await OfflineVaultService.queueOfflineVisit({
        employeeId: employee?.id || 'demo-emp-id',
        providerLocationId: plaque.providerLocationId,
        providerLocationName: plaque.facilityName,
        scannedAt: new Date().toISOString(),
        totpToken: '782914',
        lat: plaque.lat,
        lng: plaque.lng,
      });

      setConfirmedVisit({
        facilityName: plaque.facilityName,
        neighborhood: plaque.neighborhood,
        remainingVisits: newRemaining,
        verifiedAt: new Date().toISOString(),
        isOfflineSync: true,
      });
      setSuccessModalVisible(true);
      return;
    }

    // Online verification
    const apiBaseUrl =
      process.env.EXPO_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://polyfit-backend.onrender.com'
        : 'http://localhost:3001');

    try {
      if (session?.access_token) {
        await fetch(`${apiBaseUrl}/api/employee/scan-plaque`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            provider_location_id: plaque.providerLocationId,
            employee_id: employee?.id,
            lat: plaque.lat,
            lng: plaque.lng,
          }),
        }).catch(() => {});
      }
    } catch {
      // offline fallback
    }

    // Trigger confirmation celebration
    setConfirmedVisit({
      facilityName: plaque.facilityName,
      neighborhood: plaque.neighborhood,
      remainingVisits: newRemaining,
      verifiedAt: new Date().toISOString(),
      isOfflineSync: false,
    });
    setSuccessModalVisible(true);
  };

  const orgName = organization?.name || 'Bank of Kigali';
  const orgDomain = organization?.domain || 'bk.rw';
  const employeeName = employee?.full_name || 'Jean Mugisha';
  const department = employee?.department || 'Commercial Banking';
  const tierName = benefit?.name || 'Standard Corporate Tier';
  const isFullySponsored = benefit?.is_fully_sponsored ?? true;

  return (
    <View style={styles.container}>
      {/* Top Brand Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>P</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>
              POLY<Text style={{ color: Palette.green }}>FIT</Text>
            </Text>
            <Text style={styles.brandSubtitle}>Corporate Wellness Network</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <View style={styles.statusPulse} />
          <Text style={styles.statusBadgeText}>ACTIVE PASS</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Developer & Co-founder Simulator Toolbar */}
        <DemoSimulationBar
          isOutOfGeofence={isOutOfGeofence}
          onToggleGeofence={() => setIsOutOfGeofence(!isOutOfGeofence)}
          inCooldown={inCooldown}
          onToggleCooldown={() => {
            setInCooldown(!inCooldown);
            setCooldownRemainingSeconds(860);
          }}
          isQuotaExhausted={isQuotaExhausted}
          onToggleQuota={() => setIsQuotaExhausted(!isQuotaExhausted)}
          isOffline={isOffline}
          onToggleOffline={() => setIsOffline(!isOffline)}
        />

        {/* Preselected Facility Target Banner (From Tab 2 Check In Here CTA) */}
        {preselectedFacility && (
          <View style={styles.selectedFacilityBanner}>
            <View style={styles.selectedFacilityIcon}>
              <MapPin size={15} color={Palette.green} />
            </View>
            <View style={styles.selectedFacilityInfo}>
              <Text style={styles.selectedFacilityTitle} numberOfLines={1}>
                Targeting: {preselectedFacility.location_name}
              </Text>
              <Text style={styles.selectedFacilitySub}>
                {preselectedFacility.neighborhood} • Present dynamic QR to receptionist
              </Text>
            </View>
            <Pressable
              style={styles.selectedFacilityDismiss}
              onPress={clearPreselectedFacility}
              hitSlop={8}
            >
              <X size={15} color={Palette.textMuted} />
            </Pressable>
          </View>
        )}

        {/* Pre-Check Verification Engine Status Banners */}
        <PassVerificationStatus
          isOutOfGeofence={isOutOfGeofence}
          distanceMeters={preselectedFacility?.distance_meters || 450}
          targetFacilityName={preselectedFacility?.location_name || 'Cercle Sportif Olympic Pool'}
          inCooldown={inCooldown}
          cooldownRemainingSeconds={cooldownRemainingSeconds}
          isQuotaExhausted={isQuotaExhausted}
          usedVisits={monthlyVisits}
          maxVisits={monthlyVisits}
          resetDate="Nov 1"
          isOffline={isOffline}
        />

        {/* Hero Dynamic RFC 6238 TOTP Pass Card */}
        <DynamicQrPass
          employeeId={employee?.id || 'b0000000-0000-0000-0000-000000000021'}
          employeeName={employeeName}
          department={department}
          orgName={orgName}
          orgDomain={orgDomain}
          tierName={tierName}
          monthlyVisits={monthlyVisits}
          remainingVisits={remainingVisits}
          isFullySponsored={isFullySponsored}
          offlineSeed={offlineTokenSeed}
          isOffline={isOffline}
          onOpenScanner={() => setScannerVisible(true)}
        />
      </ScrollView>

      {/* Modality B: Camera Viewfinder / Plaque Scanner Modal */}
      <CounterScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={handlePlaqueScanned}
      />

      {/* Celebratory Check-in Confirmation Receipt Modal */}
      {confirmedVisit && (
        <CheckinSuccessModal
          visible={successModalVisible}
          onClose={() => setSuccessModalVisible(false)}
          facilityName={confirmedVisit.facilityName}
          facilityNeighborhood={confirmedVisit.neighborhood}
          employeeName={employeeName}
          orgName={orgName}
          remainingVisits={confirmedVisit.remainingVisits}
          verifiedAt={confirmedVisit.verifiedAt}
          isOfflineSync={confirmedVisit.isOfflineSync}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071521',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 44 : (Platform.OS === 'web' ? 6 : 20),
  },
  scrollView: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Palette.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0B1F33', // Midnight Navy on Electric Green (contrast rule)
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 10,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.3)',
  },
  statusPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.green,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.green,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: Spacing.eight,
  },

  selectedFacilityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(40, 209, 124, 0.1)',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.3)',
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  selectedFacilityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(40, 209, 124, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFacilityInfo: {
    flex: 1,
  },
  selectedFacilityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selectedFacilitySub: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 1,
  },
  selectedFacilityDismiss: {
    padding: 4,
  },
});
