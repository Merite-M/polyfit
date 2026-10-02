/**
 * PolyFit Corporate Employee App - Tab 1: Access Pass
 * PF-105: Frictionless Corporate Employee Onboarding & Benefit Activation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  WifiOff,
  LogOut,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
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

  // Dynamic TOTP code generator simulation with 60-second window
  const [totpCode, setTotpCode] = useState('782 914');
  const [secondsRemaining, setSecondsRemaining] = useState(58);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const seconds = now.getSeconds();
      const rem = 60 - (seconds % 60);
      setSecondsRemaining(rem);

      // Simple deterministic rotating pass code based on seed & 60s epoch
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoIconText}>P</Text>
              </View>
              <Text style={styles.brandTitle}>
                POLY<Text style={styles.brandAccent}>FIT</Text>
              </Text>
            </View>
            <Text style={styles.screenSubtitle}>Corporate Wellness Network</Text>
          </View>

          <View style={styles.statusBadge}>
            <View style={styles.statusPulse} />
            <Text style={styles.statusBadgeText}>PASS ACTIVE</Text>
          </View>
        </View>

        {/* Corporate Pass Card */}
        <View style={styles.passCard}>
          {/* Organization Affiliation Bar */}
          <View style={styles.passHeader}>
            <View style={styles.orgInfo}>
              <Building2 size={16} color={Palette.teal} />
              <Text style={styles.orgNameText}>{orgName}</Text>
              <View style={styles.domainChip}>
                <Text style={styles.domainChipText}>{orgDomain}</Text>
              </View>
            </View>
            <View style={styles.verifiedChip}>
              <ShieldCheck size={14} color={Palette.green} />
              <Text style={styles.verifiedChipText}>VERIFIED</Text>
            </View>
          </View>

          {/* Beneficiary Details */}
          <View style={styles.beneficiarySection}>
            <View>
              <Text style={styles.beneficiaryLabel}>BENEFICIARY</Text>
              <Text style={styles.beneficiaryName}>{employeeName}</Text>
              <Text style={styles.beneficiaryDept}>{department}</Text>
            </View>
            <View style={styles.benefitTierPill}>
              <Text style={styles.benefitTierText}>{tierName}</Text>
            </View>
          </View>

          {/* Dynamic TOTP Access Display */}
          <View style={styles.totpContainer}>
            <Text style={styles.totpLabel}>DYNAMIC ACCESS CODE</Text>
            <Text style={styles.totpCode}>{totpCode}</Text>

            {/* Countdown Bar */}
            <View style={styles.progressContainer}>
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
                <Text style={styles.timerText}>
                  Refreshes in {secondsRemaining}s
                </Text>
              </View>
              <View style={styles.offlineRow}>
                <WifiOff size={12} color={Palette.teal} />
                <Text style={styles.offlineText}>Offline Ready (Basement Safe)</Text>
              </View>
            </View>
          </View>

          {/* Pass Footer */}
          <View style={styles.passFooter}>
            <View style={styles.passIdRow}>
              <Text style={styles.passIdText}>
                TOKEN: {(offlineTokenSeed || 'b0000000').slice(0, 16).toUpperCase()}...
              </Text>
            </View>
            <Text style={styles.scanNotice}>
              Show this screen or NFC tap at provider reception
            </Text>
          </View>
        </View>

        {/* Subsidy & Usage Allocation Card */}
        <View style={styles.subsidyCard}>
          <View style={styles.subsidyHeader}>
            <View style={styles.subsidyTitleRow}>
              <Sparkles size={18} color={Palette.green} />
              <Text style={styles.subsidyCardTitle}>Benefit Utilization</Text>
            </View>
            <View style={styles.subsidyPill}>
              <Text style={styles.subsidyPillText}>
                {subsidyPct}% Employer Funded
              </Text>
            </View>
          </View>

          {/* Usage Meter */}
          <View style={styles.usageRow}>
            <View style={styles.usageStat}>
              <Text style={styles.usageValue}>{monthlyVisits}</Text>
              <Text style={styles.usageLabel}>Monthly Visits</Text>
            </View>
            <View style={styles.usageDivider} />
            <View style={styles.usageStat}>
              <Text style={[styles.usageValue, { color: Palette.green }]}>
                {monthlyVisits}
              </Text>
              <Text style={styles.usageLabel}>Remaining</Text>
            </View>
            <View style={styles.usageDivider} />
            <View style={styles.usageStat}>
              <Text style={styles.usageValue}>
                {isFullySponsored ? '0 RWF' : 'Co-Pay'}
              </Text>
              <Text style={styles.usageLabel}>Employee Cost</Text>
            </View>
          </View>

          <View style={styles.resetRow}>
            <Calendar size={14} color={Palette.textMuted} />
            <Text style={styles.resetText}>
              Usage cycle resets on 1st of next month
            </Text>
          </View>
        </View>

        {/* Eligible Facility Network */}
        <View style={styles.facilityCard}>
          <Text style={styles.facilityTitle}>Included Wellness Providers</Text>
          <Text style={styles.facilitySubtitle}>
            Access all verified facilities across Kigali with zero out-of-pocket
            charges:
          </Text>

          <View style={styles.categoryGrid}>
            {[
              'Gyms & Fitness Centers',
              'Olympic Pools & Swimming',
              'Yoga & Pilates Studios',
              'Physiotherapy Clinics',
              'Wellness Centers',
            ].map((cat, idx) => (
              <View key={idx} style={styles.categoryChip}>
                <CheckCircle2 size={13} color={Palette.teal} />
                <Text style={styles.categoryChipText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Co-Founder / Demo Switcher & Account Controls */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Account & Demo Controls</Text>
          <Text style={styles.demoSubtitle}>
            Switch corporate employer profile to verify multi-tenant aggregator
            subsidy logic:
          </Text>

          <View style={styles.demoBtnRow}>
            <TouchableOpacity
              style={[
                styles.demoBtn,
                orgDomain === 'bk.rw' && styles.demoBtnActive,
              ]}
              onPress={() => loadDemoAccount('bk')}>
              <Text
                style={[
                  styles.demoBtnText,
                  orgDomain === 'bk.rw' && styles.demoBtnTextActive,
                ]}>
                Bank of Kigali (100%)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.demoBtn,
                orgDomain === 'techcorp.rw' && styles.demoBtnActive,
              ]}
              onPress={() => loadDemoAccount('techcorp')}>
              <Text
                style={[
                  styles.demoBtnText,
                  orgDomain === 'techcorp.rw' && styles.demoBtnTextActive,
                ]}>
                TechCorp (85%)
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut size={16} color="#FF5A65" />
            <Text style={styles.logoutButtonText}>
              Log Out / Re-test Onboarding Flow
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071521',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.eight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    color: '#0B1F33',
    fontWeight: '900',
    fontSize: 16,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  brandAccent: {
    color: Palette.green,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.4)',
  },
  statusPulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Palette.green,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.green,
    letterSpacing: 0.5,
  },

  // Pass Card
  passCard: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.35)',
    padding: Spacing.four,
    marginBottom: Spacing.four,
    shadowColor: Palette.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgNameText: {
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
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(40, 209, 124, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedChipText: {
    color: Palette.green,
    fontSize: 10,
    fontWeight: '800',
  },

  beneficiarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  beneficiaryLabel: {
    fontSize: 10,
    fontWeight: '700',
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
    fontSize: 13,
    color: Palette.teal,
    fontWeight: '500',
    marginTop: 2,
  },
  benefitTierPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  benefitTierText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },

  // TOTP Access Container
  totpContainer: {
    backgroundColor: '#071521',
    borderRadius: Radius.md,
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  totpLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Palette.textMuted,
    marginBottom: 6,
  },
  totpCode: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    color: Palette.green,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: Spacing.three,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    alignSelf: 'stretch',
    overflow: 'hidden',
    marginBottom: Spacing.two,
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

  passFooter: {
    marginTop: Spacing.three,
    alignItems: 'center',
  },
  passIdRow: {
    marginBottom: 4,
  },
  passIdText: {
    fontSize: 10,
    color: Palette.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scanNotice: {
    fontSize: 11,
    color: '#A0AEC0',
    textAlign: 'center',
  },

  // Subsidy Card
  subsidyCard: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  subsidyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  subsidyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subsidyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subsidyPill: {
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  subsidyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.green,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#071521',
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.two,
  },
  usageStat: {
    alignItems: 'center',
  },
  usageValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  usageLabel: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 2,
  },
  usageDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  resetText: {
    fontSize: 11,
    color: Palette.textMuted,
  },

  // Facility Card
  facilityCard: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  facilityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  facilitySubtitle: {
    fontSize: 12,
    color: Palette.textMuted,
    marginBottom: Spacing.three,
    lineHeight: 16,
  },
  categoryGrid: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#071521',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  categoryChipText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
  },

  // Demo & Account Card
  demoCard: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.four,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  demoSubtitle: {
    fontSize: 12,
    color: Palette.textMuted,
    marginBottom: Spacing.three,
    lineHeight: 16,
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#071521',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoBtnActive: {
    borderColor: Palette.green,
    backgroundColor: 'rgba(40, 209, 124, 0.1)',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  demoBtnTextActive: {
    color: Palette.green,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 101, 0.3)',
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 90, 101, 0.08)',
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5A65',
  },
});
