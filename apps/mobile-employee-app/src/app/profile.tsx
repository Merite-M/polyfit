/**
 * PolyFit Corporate Employee App - Tab 3: Profile & Corporate Benefit Status (PF-102)
 * Compliant with Stitch Design Center and corporate aggregator standards
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import {
  Building2,
  ShieldCheck,
  Calendar,
  Sparkles,
  LogOut,
  User,
  Mail,
  Briefcase,
  Layers,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfileScreen() {
  const {
    employee,
    organization,
    benefit,
    logout,
    loadDemoAccount,
  } = useAuthStore();

  const orgName = organization?.name || 'Bank of Kigali';
  const orgDomain = organization?.domain || 'bk.rw';
  const employeeName = employee?.full_name || 'Jean Mugisha';
  const employeeEmail = employee?.email || 'jean.mugisha@bk.rw';
  const department = employee?.department || 'Commercial Banking';
  const tierName = benefit?.name || 'Standard Corporate Tier';
  const monthlyVisits = benefit?.max_monthly_visits || 12;
  const isFullySponsored = benefit?.is_fully_sponsored ?? true;
  const coPayPct = benefit?.co_pay_percentage ?? 0;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Profile & Benefit</Text>
        <Text style={styles.headerSub}>Corporate eligibility & membership credentials</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Beneficiary Identity Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <User size={32} color={Palette.green} />
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.employeeName}>{employeeName}</Text>
            <View style={styles.emailRow}>
              <Mail size={13} color={Palette.textMuted} />
              <Text style={styles.employeeEmail}>{employeeEmail}</Text>
            </View>
            <View style={styles.deptRow}>
              <Briefcase size={13} color={Palette.teal} />
              <Text style={styles.deptText}>{department}</Text>
            </View>
          </View>
        </View>

        {/* Corporate Subsidy Package Card */}
        <View style={styles.benefitCard}>
          <View style={styles.benefitHeader}>
            <View style={styles.orgBadgeRow}>
              <Building2 size={16} color={Palette.teal} />
              <Text style={styles.orgName}>{orgName}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={Palette.green} />
              <Text style={styles.verifiedBadgeText}>ACTIVE SUBSIDY</Text>
            </View>
          </View>

          <Text style={styles.planTitle}>{tierName}</Text>

          <View style={styles.benefitMetrics}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{monthlyVisits}</Text>
              <Text style={styles.metricLabel}>Monthly Visits</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, { color: Palette.green }]}>
                {isFullySponsored ? '100%' : `${100 - coPayPct}%`}
              </Text>
              <Text style={styles.metricLabel}>Company Funded</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>
                {isFullySponsored ? '0 RWF' : 'Co-Pay'}
              </Text>
              <Text style={styles.metricLabel}>Employee Cost</Text>
            </View>
          </View>
        </View>

        {/* Demo Switcher for Multi-Tenant Testing */}
        <View style={styles.demoSection}>
          <View style={styles.sectionHeaderRow}>
            <Layers size={14} color={Palette.teal} />
            <Text style={styles.sectionTitle}>Multi-Tenant Testing Switcher</Text>
          </View>
          <Text style={styles.sectionSub}>
            Toggle between corporate tenant accounts to test benefit packages:
          </Text>

          <View style={styles.demoList}>
            <Pressable
              style={[
                styles.demoItem,
                orgDomain === 'bk.rw' && styles.demoItemActive,
              ]}
              onPress={() => loadDemoAccount('bk')}
            >
              <Building2 size={16} color={orgDomain === 'bk.rw' ? Palette.green : Palette.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.demoTitle}>Bank of Kigali</Text>
                <Text style={styles.demoSub}>100% Fully Sponsored • 12 Visits/mo</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.demoItem,
                orgDomain === 'techcorp.rw' && styles.demoItemActive,
              ]}
              onPress={() => loadDemoAccount('techcorp')}
            >
              <Building2 size={16} color={orgDomain === 'techcorp.rw' ? Palette.green : Palette.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.demoTitle}>TechCorp Rwanda</Text>
                <Text style={styles.demoSub}>85% Corporate Subsidy • 8 Visits/mo</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Sign Out Action */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={logout}
        >
          <LogOut size={16} color="#FF5A65" />
          <Text style={styles.logoutBtnText}>Log Out / Reset Session</Text>
        </Pressable>
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
    marginBottom: Spacing.three,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.eight,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.3)',
  },
  profileMeta: {
    flex: 1,
  },
  employeeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  employeeEmail: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deptText: {
    fontSize: 11,
    color: Palette.teal,
    fontWeight: '500',
  },

  benefitCard: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  benefitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  orgBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.green,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.green,
    marginBottom: Spacing.three,
  },
  benefitMetrics: {
    flexDirection: 'row',
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    padding: Spacing.two,
    gap: 8,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Palette.textMuted,
    textTransform: 'uppercase',
  },

  demoSection: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontSize: 11,
    color: Palette.textMuted,
    marginBottom: Spacing.three,
  },
  demoList: {
    gap: 8,
  },
  demoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  demoItemActive: {
    borderColor: Palette.green,
    backgroundColor: 'rgba(40, 209, 124, 0.08)',
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  demoSub: {
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
    paddingVertical: 14,
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
