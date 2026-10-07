/**
 * PolyFit Corporate Employee App - Step 3: Subsidy Transparency & Benefit Activation
 * PF-105: Frictionless Corporate Employee Onboarding & Benefit Activation
 * Compliant with expo-native-ui, expo-animation, and vercel-react-native-skills
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  WifiOff,
  Dumbbell,
  Waves,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Palette, Radius, Spacing, Fonts } from '@/constants/theme';

export const SubsidyShowcaseStep: React.FC = () => {
  const {
    organization,
    benefit,
    employee,
    isLoading,
    error,
    setStep,
    submitActivateBenefit,
  } = useAuthStore();

  const orgName = organization?.name || 'Bank of Kigali';
  const orgDomain = organization?.domain || 'bk.rw';
  const employeeName = employee?.full_name || 'Jean Mugisha';
  const department = employee?.department || 'Commercial Banking';
  const tierName = benefit?.name || 'Corporate Wellness Tier';
  const monthlyVisits = benefit?.max_monthly_visits || 12;
  const subsidyPct = benefit?.subsidy_percentage ?? 100;
  const isFullySponsored = benefit?.is_fully_sponsored ?? true;

  return (
    <View style={styles.screenContainer}>
      {/* Top Header & Progress Stepper */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={() => setStep('otp')}
        >
          <ArrowLeft size={18} color="#FFFFFF" />
        </Pressable>

        {/* Step Progress Pills (Step 3 of 3) */}
        <View style={styles.stepperContainer}>
          <View style={[styles.stepPill, styles.stepPillCompleted]} />
          <View style={[styles.stepPill, styles.stepPillCompleted]} />
          <View style={[styles.stepPill, styles.stepPillActive]} />
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.contentBody}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Block */}
        <View style={styles.headerBlock}>
          <Text style={styles.screenTitle}>Your benefit is ready!</Text>
          <Text style={styles.screenSubtitle}>
            Sponsored by <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{orgName}</Text>.
            Review your unlocked access pass below:
          </Text>
        </View>

        {/* Apple Wallet Style Digital Corporate Pass */}
        <View style={styles.passCard}>
          {/* Card Top: Employer Header */}
          <View style={styles.cardHeader}>
            <View style={styles.orgRow}>
              <View style={styles.orgBadge}>
                <Building2 size={16} color={Palette.green} />
              </View>
              <View>
                <Text style={styles.orgName}>{orgName}</Text>
                <Text style={styles.planSub}>{tierName}</Text>
              </View>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color={Palette.green} />
              <Text style={styles.verifiedText}>SPONSORED</Text>
            </View>
          </View>

          {/* Card Center: Big Subsidy Banner */}
          <View style={styles.subsidyBanner}>
            <View>
              <Text style={styles.subsidyLabel}>EMPLOYER SPONSORSHIP</Text>
              <Text style={styles.subsidyHighlight}>
                {isFullySponsored ? '100% Covered' : `${subsidyPct}% Subsidized`}
              </Text>
            </View>
            <View style={styles.costBadge}>
              <Text style={styles.costAmount}>
                {isFullySponsored ? '0 RWF' : 'Co-Pay'}
              </Text>
              <Text style={styles.costSub}>per visit</Text>
            </View>
          </View>

          {/* Quota Row */}
          <View style={styles.quotaRow}>
            <View style={styles.quotaStat}>
              <Text style={styles.quotaNumber}>{monthlyVisits}</Text>
              <Text style={styles.quotaLabel}>Monthly Visits</Text>
            </View>
            <View style={styles.quotaDivider} />
            <View style={styles.quotaStat}>
              <Text style={styles.quotaNumber}>45+</Text>
              <Text style={styles.quotaLabel}>Facilities</Text>
            </View>
            <View style={styles.quotaDivider} />
            <View style={styles.quotaStat}>
              <Text style={styles.quotaNumber}>Kigali</Text>
              <Text style={styles.quotaLabel}>Coverage</Text>
            </View>
          </View>

          {/* Card Footer: Beneficiary Info */}
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.beneficiaryLabel}>BENEFICIARY</Text>
              <Text style={styles.beneficiaryName}>{employeeName}</Text>
              <Text style={styles.beneficiaryDept}>{department}</Text>
            </View>
            <View style={styles.corporatePill}>
              <Text style={styles.corporatePillText}>{orgDomain}</Text>
            </View>
          </View>
        </View>

        {/* Included Categories Mini-Grid */}
        <View style={styles.perksContainer}>
          <Text style={styles.perksHeader}>UNLOCKED IN YOUR NETWORK</Text>
          <View style={styles.perksRow}>
            <View style={styles.perkChip}>
              <Dumbbell size={16} color={Palette.teal} />
              <Text style={styles.perkChipText}>Fitness Clubs</Text>
            </View>
            <View style={styles.perkChip}>
              <Waves size={16} color={Palette.teal} />
              <Text style={styles.perkChipText}>Swimming Pools</Text>
            </View>
            <View style={styles.perkChip}>
              <Sparkles size={16} color={Palette.teal} />
              <Text style={styles.perkChipText}>Yoga & Studios</Text>
            </View>
          </View>
        </View>

        {/* Offline Safety Assurance */}
        <View style={styles.safetyRow}>
          <WifiOff size={14} color={Palette.teal} />
          <Text style={styles.safetyText}>
            Offline Ready: Dynamic pass works in underground partner facilities without mobile data.
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Pinned Action Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.guaranteeText}>
          ✓ Direct corporate settlement • Zero out-of-pocket charges
        </Text>

        {/* Primary CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            isLoading && styles.continueButtonDisabled,
            pressed && !isLoading && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={submitActivateBenefit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0B1F33" />
          ) : (
            <View style={styles.continueButtonContent}>
              <Text style={styles.continueButtonText}>Activate My Corporate Pass</Text>
              <ArrowRight size={18} color="#0B1F33" />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#071521',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepPill: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepPillCompleted: {
    backgroundColor: 'rgba(40, 209, 124, 0.4)',
    width: 20,
  },
  stepPillActive: {
    backgroundColor: Palette.green,
    width: 28,
  },

  contentBody: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.four,
  },
  headerBlock: {
    marginBottom: Spacing.four,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
  },

  // Apple Wallet Style Card
  passCard: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.35)',
    padding: Spacing.four,
    marginBottom: Spacing.three,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(40, 209, 124, 0.12)',
      },
      default: {
        shadowColor: Palette.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orgBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planSub: {
    fontSize: 11,
    color: Palette.textMuted,
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
  verifiedText: {
    color: Palette.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  subsidyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 209, 124, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.2)',
  },
  subsidyLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal,
    letterSpacing: 1,
    marginBottom: 2,
  },
  subsidyHighlight: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  costBadge: {
    backgroundColor: Palette.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  costAmount: {
    color: '#0B1F33',
    fontWeight: '900',
    fontSize: 14,
  },
  costSub: {
    color: '#0B1F33',
    fontSize: 9,
    fontWeight: '700',
  },

  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#071521',
    borderRadius: Radius.md,
    paddingVertical: 10,
    marginBottom: Spacing.three,
  },
  quotaStat: {
    alignItems: 'center',
  },
  quotaNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quotaLabel: {
    fontSize: 10,
    color: Palette.textMuted,
    marginTop: 2,
  },
  quotaDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: Spacing.two,
  },
  beneficiaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  beneficiaryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  beneficiaryDept: {
    fontSize: 11,
    color: Palette.teal,
    marginTop: 1,
  },
  corporatePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  corporatePillText: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '600',
  },

  perksContainer: {
    marginBottom: Spacing.three,
  },
  perksHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perkChip: {
    flex: 1,
    minWidth: 95,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D2235',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  perkChipText: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
  },

  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 210, 180, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginBottom: Spacing.three,
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    color: Palette.teal,
    lineHeight: 15,
  },

  errorBanner: {
    backgroundColor: 'rgba(255, 90, 101, 0.12)',
    borderRadius: Radius.sm,
    padding: 10,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#FF5A65',
    fontSize: 13,
    fontWeight: '500',
  },

  bottomBar: {
    gap: 10,
  },
  guaranteeText: {
    fontSize: 11,
    color: Palette.textMuted,
    textAlign: 'center',
  },

  continueButton: {
    height: 54,
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(40, 209, 124, 0.35)',
      },
      default: {
        shadowColor: Palette.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 7,
        elevation: 6,
      },
    }),
  },
  continueButtonDisabled: {
    opacity: 0.45,
    ...Platform.select({
      web: {
        boxShadow: 'none',
      },
      default: {
        elevation: 0,
        shadowOpacity: 0,
      },
    }),
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#0B1F33',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts?.sans,
  },
});
