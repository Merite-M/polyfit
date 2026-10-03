/**
 * PolyFit Corporate Employee App - Tab 1: Access Pass
 * PF-105: Frictionless Corporate Employee Onboarding & Benefit Activation
 * Compliant with expo-native-ui, expo-animation, and vercel-react-native-skills
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import {
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  WifiOff,
  LogOut,
  Clock,
  CheckCircle2,
  QrCode,
  Dumbbell,
  Waves,
} from 'lucide-react-native';
import { Palette, Spacing, Radius, Fonts } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function AccessPassScreen() {
  const {
    employee,
    organization,
    benefit,
    offlineTokenSeed,
    logout,
    loadDemoAccount,
  } = useAuthStore();

  const [activeSegment, setActiveSegment] = useState<'pass' | 'facilities' | 'account'>('pass');
  const [totpCode, setTotpCode] = useState('782 914');
  const [secondsRemaining, setSecondsRemaining] = useState(58);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const seconds = now.getSeconds();
      const rem = 60 - (seconds % 60);
      setSecondsRemaining(rem);

      const epochWindow = Math.floor(now.getTime() / 60000);
      const seedVal = (offlineTokenSeed || 'default-seed')
        .split('')
        .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 1000000, epochWindow);
      const codeStr = String(Math.abs(seedVal)).padStart(6, '0');
      setTotpCode(`${codeStr.slice(0, 3)} ${codeStr.slice(3)}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [offlineTokenSeed]);

  const orgName = organization?.name || 'Bank of Kigali';
  const orgDomain = organization?.domain || 'bk.rw';
  const employeeName = employee?.full_name || 'Jean Mugisha';
  const department = employee?.department || 'Commercial Banking';
  const tierName = benefit?.name || 'Standard Corporate Tier';
  const monthlyVisits = benefit?.max_monthly_visits || 12;
  const subsidyPct = benefit?.subsidy_percentage ?? 100;
  const isFullySponsored = benefit?.is_fully_sponsored ?? true;

  return (
    <View style={styles.container}>
      {/* Top Header */}
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

      {/* Segment Switcher */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segmentBtn, activeSegment === 'pass' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('pass')}
        >
          <Text style={[styles.segmentText, activeSegment === 'pass' && styles.segmentTextActive]}>
            Digital Pass
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeSegment === 'facilities' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('facilities')}
        >
          <Text style={[styles.segmentText, activeSegment === 'facilities' && styles.segmentTextActive]}>
            Facilities
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeSegment === 'account' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('account')}
        >
          <Text style={[styles.segmentText, activeSegment === 'account' && styles.segmentTextActive]}>
            Account
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSegment === 'pass' && (
          <View style={styles.passTabContent}>
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

              {/* Beneficiary Row */}
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

              {/* Dynamic TOTP Access Display */}
              <View style={styles.totpContainer}>
                <View style={styles.totpHeader}>
                  <QrCode size={14} color={Palette.teal} />
                  <Text style={styles.totpLabel}>RECEPTION CHECK-IN CODE</Text>
                </View>
                <Text style={styles.totpCode}>{totpCode}</Text>

                {/* Progress countdown */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${(secondsRemaining / 60) * 100}%` },
                    ]}
                  />
                </View>

                <View style={styles.timerMetaRow}>
                  <View style={styles.timerRow}>
                    <Clock size={12} color={Palette.textMuted} />
                    <Text style={styles.timerText}>Refreshes in {secondsRemaining}s</Text>
                  </View>
                  <View style={styles.offlineRow}>
                    <WifiOff size={12} color={Palette.teal} />
                    <Text style={styles.offlineText}>Offline Ready (Basement Safe)</Text>
                  </View>
                </View>
              </View>

              {/* Pass Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.scanNotice}>
                  Show this dynamic code or NFC tap at provider front desk
                </Text>
              </View>
            </View>

            {/* Quota & Allocation Summary Pill */}
            <View style={styles.quotaPillContainer}>
              <View style={styles.quotaPillItem}>
                <Text style={styles.quotaPillNum}>{monthlyVisits}</Text>
                <Text style={styles.quotaPillSub}>Monthly Visits</Text>
              </View>
              <View style={styles.quotaPillDivider} />
              <View style={styles.quotaPillItem}>
                <Text style={[styles.quotaPillNum, { color: Palette.green }]}>
                  {monthlyVisits}
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
        )}

        {activeSegment === 'facilities' && (
          <View style={styles.facilitiesContent}>
            <Text style={styles.sectionHeading}>Included Kigali Network</Text>
            <Text style={styles.sectionSub}>
              Access all partner locations with zero out-of-pocket charges:
            </Text>

            <View style={styles.facilityList}>
              {[
                { title: 'Fitness Centers & Gyms', count: '18 Locations', desc: 'Full weight rooms, cardio & machines' },
                { title: 'Olympic & Leisure Pools', count: '8 Locations', desc: 'Lap swimming and recovery thermal pools' },
                { title: 'Yoga & Pilates Studios', count: '12 Locations', desc: 'Group sessions, mats and wellness classes' },
                { title: 'Recovery & Physio Clinics', count: '7 Locations', desc: 'Sports therapy and post-workout clinics' },
              ].map((item, idx) => (
                <View key={idx} style={styles.facilityCard}>
                  <View style={styles.facilityCardHeader}>
                    <Text style={styles.facilityCardTitle}>{item.title}</Text>
                    <View style={styles.facilityCountBadge}>
                      <Text style={styles.facilityCountText}>{item.count}</Text>
                    </View>
                  </View>
                  <Text style={styles.facilityCardDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeSegment === 'account' && (
          <View style={styles.accountContent}>
            <Text style={styles.sectionHeading}>Corporate Profile</Text>
            <Text style={styles.sectionSub}>
              Switch demo profiles to test multi-tenant subsidy configurations:
            </Text>

            <View style={styles.demoSwitcher}>
              <Pressable
                style={[
                  styles.demoOptionBtn,
                  orgDomain === 'bk.rw' && styles.demoOptionBtnActive,
                ]}
                onPress={() => loadDemoAccount('bk')}
              >
                <Building2 size={16} color={orgDomain === 'bk.rw' ? Palette.green : Palette.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoOptionTitle}>Bank of Kigali</Text>
                  <Text style={styles.demoOptionSub}>100% Fully Sponsored • 12 Visits/mo</Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.demoOptionBtn,
                  orgDomain === 'techcorp.rw' && styles.demoOptionBtnActive,
                ]}
                onPress={() => loadDemoAccount('techcorp')}
              >
                <Building2 size={16} color={orgDomain === 'techcorp.rw' ? Palette.green : Palette.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoOptionTitle}>TechCorp Rwanda</Text>
                  <Text style={styles.demoOptionSub}>85% Corporate Subsidy • 10 Visits/mo</Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={logout}
            >
              <LogOut size={16} color="#FF5A65" />
              <Text style={styles.logoutBtnText}>Log Out / Re-test Onboarding Flow</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071521',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
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
    gap: 8,
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#0B1F33',
    fontWeight: '900',
    fontSize: 16,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 10,
    color: Palette.textMuted,
    marginTop: -2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.35)',
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

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#0D2235',
    borderRadius: Radius.btn,
    padding: 4,
    marginBottom: Spacing.three,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: '#1E3A52',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  scrollContent: {
    paddingBottom: Spacing.eight,
  },

  passTabContent: {
    gap: Spacing.three,
  },
  heroPassCard: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.35)',
    padding: Spacing.four,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 16px rgba(40, 209, 124, 0.15)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  domainChip: {
    backgroundColor: 'rgba(0, 210, 180, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  domainChipText: {
    color: Palette.teal,
    fontSize: 10,
    fontWeight: '600',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  beneficiaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  beneficiaryName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  beneficiaryDept: {
    fontSize: 12,
    color: Palette.teal,
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierBadgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },

  totpContainer: {
    backgroundColor: '#071521',
    borderRadius: Radius.md,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  totpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  totpLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.textMuted,
  },
  totpCode: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    color: Palette.green,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: Spacing.two,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    alignSelf: 'stretch',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Palette.green,
  },
  timerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 11,
    color: Palette.textMuted,
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offlineText: {
    fontSize: 11,
    color: Palette.teal,
    fontWeight: '600',
  },

  cardFooter: {
    marginTop: Spacing.three,
    alignItems: 'center',
  },
  scanNotice: {
    fontSize: 11,
    color: Palette.textSecondary,
    textAlign: 'center',
  },

  quotaPillContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quotaPillItem: {
    alignItems: 'center',
  },
  quotaPillNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quotaPillSub: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 2,
  },
  quotaPillDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  facilitiesContent: {
    gap: Spacing.two,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginBottom: Spacing.three,
  },
  facilityList: {
    gap: 10,
  },
  facilityCard: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  facilityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  facilityCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  facilityCountBadge: {
    backgroundColor: 'rgba(0, 210, 180, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  facilityCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.teal,
  },
  facilityCardDesc: {
    fontSize: 12,
    color: Palette.textMuted,
  },

  accountContent: {
    gap: Spacing.three,
  },
  demoSwitcher: {
    gap: 10,
  },
  demoOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  demoOptionBtnActive: {
    borderColor: Palette.green,
    backgroundColor: 'rgba(40, 209, 124, 0.08)',
  },
  demoOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoOptionSub: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 90, 101, 0.1)',
    borderRadius: Radius.btn,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 101, 0.3)',
    marginTop: Spacing.two,
  },
  logoutBtnText: {
    color: '#FF5A65',
    fontSize: 13,
    fontWeight: '700',
  },
});
