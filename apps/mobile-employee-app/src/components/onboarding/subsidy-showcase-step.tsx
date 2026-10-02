/**
 * Corporate Subsidy & Package Transparency Showcase (PF-105 Step 2)
 * High-impact presentation of employer-funded perks, visit quota, and category badges
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Palette, Radius, Spacing, Fonts, Shadows } from '@/constants/theme';
import { PolyFitBrandHeader } from './polyfit-brand-header';

interface CategoryBadgeItem {
  key: string;
  name: string;
  icon: string;
  description: string;
}

const CATEGORY_ITEMS: CategoryBadgeItem[] = [
  { key: 'gym', name: 'Fitness & Gyms', icon: '🏋️', description: 'Full access to equipment & weights' },
  { key: 'pool', name: 'Swimming Pools', icon: '🏊', description: 'Olympic & leisure lap pools' },
  { key: 'studio', name: 'Yoga & Studios', icon: '🧘', description: 'Pilates, yoga & HIIT group classes' },
  { key: 'wellness_center', name: 'Steam & Sauna', icon: '🧖', description: 'Thermal suites & cryotherapy' },
  { key: 'clinic', name: 'Recovery Clinics', icon: '🩺', description: 'Sports physio & wellness checkups' },
];

export const SubsidyShowcaseStep: React.FC = () => {
  const {
    organization,
    benefit,
    employee,
    isLoading,
    error,
    submitActivateBenefit,
  } = useAuthStore();

  const orgName = organization?.name || 'Your Company';
  const benefitTier = (benefit?.tier || 'Standard').toUpperCase();
  const maxVisits = benefit?.max_monthly_visits || 12;
  const isSponsored = benefit?.is_fully_sponsored ?? true;
  const subsidyPct = benefit?.subsidy_percentage ?? 100;
  const costRwf = benefit?.monthly_cost_rwf ?? 0;

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <PolyFitBrandHeader compact />

      {/* Main Subsidy Card */}
      <View style={styles.showcaseCard}>
        {/* Employer Co-branding Banner */}
        <View style={styles.employerBanner}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>CORPORATE WELLNESS BENEFIT</Text>
          </View>
          <Text style={styles.employerQuote}>
            &ldquo;{orgName} is proud to invest in your physical & mental health.&rdquo;
          </Text>
          <Text style={styles.beneficiaryName}>
            Provisioned for <Text style={styles.beneficiaryHighlight}>{employee?.full_name || 'Employee'}</Text>
          </Text>
        </View>

        {/* Subsidy Highlight Block */}
        <View style={styles.subsidyHighlightBlock}>
          <View style={styles.subsidyRow}>
            <View>
              <Text style={styles.subsidyLabel}>EMPLOYER SPONSORSHIP</Text>
              <Text style={styles.subsidyValue}>
                {isSponsored ? '100% SPONSORED' : `${subsidyPct}% SUBSIDIZED`}
              </Text>
            </View>
            <View style={styles.costBadge}>
              <Text style={styles.costBadgeAmount}>
                {costRwf === 0 ? '0 RWF' : `${costRwf.toLocaleString()} RWF`}
              </Text>
              <Text style={styles.costBadgeSub}>/ employee month</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Quota & Allowance */}
          <View style={styles.quotaRow}>
            <View style={styles.quotaItem}>
              <Text style={styles.quotaNumber}>{maxVisits}</Text>
              <Text style={styles.quotaLabel}>Verified Visits / Month</Text>
            </View>
            <View style={styles.quotaDivider} />
            <View style={styles.quotaItem}>
              <Text style={styles.quotaNumber}>45+</Text>
              <Text style={styles.quotaLabel}>In-Network Facilities</Text>
            </View>
            <View style={styles.quotaDivider} />
            <View style={styles.quotaItem}>
              <Text style={styles.quotaNumber}>{benefitTier}</Text>
              <Text style={styles.quotaLabel}>Plan Tier</Text>
            </View>
          </View>
        </View>

        {/* Unlocked Category Badges */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>UNLOCKED WELLNESS CATEGORIES</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORY_ITEMS.map((cat) => (
              <View key={cat.key} style={styles.categoryCard}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryDesc}>{cat.description}</Text>
                </View>
                <View style={styles.checkPill}>
                  <Text style={styles.checkPillText}>✓ Included</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Feature Guarantees */}
        <View style={styles.perksList}>
          <Text style={styles.perkItem}>🔒 Instant Digital Access Pass rotating every 15 seconds</Text>
          <Text style={styles.perkItem}>📶 100% Offline Pass Vault — works in gym basements without data</Text>
          <Text style={styles.perkItem}>💳 Zero credit card required — direct corporate billing</Text>
        </View>

        {/* Error box */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* 1-Tap Benefit Activation CTA */}
        <TouchableOpacity
          style={styles.activateButton}
          onPress={submitActivateBenefit}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color={Palette.navy} />
          ) : (
            <Text style={styles.activateButtonText}>Activate My Corporate Benefit →</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  showcaseCard: {
    backgroundColor: Palette.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: Spacing.four,
    ...Shadows.card,
  },
  employerBanner: {
    backgroundColor: Palette.navy,
    borderRadius: Radius.inner,
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
  badgePill: {
    backgroundColor: 'rgba(40, 209, 124, 0.2)',
    borderWidth: 1,
    borderColor: Palette.green,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: Spacing.two,
  },
  badgePillText: {
    fontFamily: Fonts?.sans,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.green,
    letterSpacing: 0.5,
  },
  employerQuote: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: Spacing.two,
  },
  beneficiaryName: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    color: '#A0AEC0',
  },
  beneficiaryHighlight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subsidyHighlightBlock: {
    backgroundColor: Palette.greenSubtle,
    borderRadius: Radius.inner,
    borderWidth: 1,
    borderColor: Palette.greenBorder,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  subsidyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subsidyLabel: {
    fontFamily: Fonts?.sans,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Palette.greenText,
    marginBottom: 2,
  },
  subsidyValue: {
    fontFamily: Fonts?.sans,
    fontSize: 18,
    fontWeight: '800',
    color: Palette.navy,
  },
  costBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.btn,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
    ...Shadows.card,
  },
  costBadgeAmount: {
    fontFamily: Fonts?.mono,
    fontSize: 14,
    fontWeight: '800',
    color: Palette.greenText,
  },
  costBadgeSub: {
    fontFamily: Fonts?.sans,
    fontSize: 10,
    color: Palette.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.greenBorder,
    marginVertical: Spacing.two,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  quotaItem: {
    flex: 1,
    alignItems: 'center',
  },
  quotaNumber: {
    fontFamily: Fonts?.mono,
    fontSize: 18,
    fontWeight: '800',
    color: Palette.navy,
  },
  quotaLabel: {
    fontFamily: Fonts?.sans,
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  quotaDivider: {
    width: 1,
    height: 24,
    backgroundColor: Palette.greenBorder,
  },
  categoriesSection: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Palette.textMuted,
    marginBottom: Spacing.two,
  },
  categoriesGrid: {
    gap: Spacing.two,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.canvas,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: Spacing.two,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: Spacing.two,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontFamily: Fonts?.sans,
    fontSize: 13,
    fontWeight: '700',
    color: Palette.navy,
  },
  categoryDesc: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    color: Palette.textMuted,
  },
  checkPill: {
    backgroundColor: Palette.greenSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Palette.greenBorder,
  },
  checkPillText: {
    fontFamily: Fonts?.sans,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.greenText,
  },
  perksList: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.btn,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    gap: 6,
  },
  perkItem: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: Palette.errorBg,
    borderRadius: Radius.inner,
    borderWidth: 1,
    borderColor: Palette.errorBorder,
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    color: Palette.errorText,
    fontWeight: '500',
    textAlign: 'center',
  },
  activateButton: {
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  activateButtonText: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '700',
    color: Palette.navy, // STRICT CONTRAST: NAVY ON GREEN
  },
});
