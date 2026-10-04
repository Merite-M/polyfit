/**
 * PolyFit Corporate Employee App - Active Benefit Card (PF-102)
 * High-contrast telemetry, transparent corporate subsidy breakdown, and category access chips
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Calendar,
  Sparkles,
  Dumbbell,
  Waves,
  HeartPulse,
  Flame,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { BenefitPackage, BenefitUsageTelemetry } from '@/types/auth';

interface ActiveBenefitCardProps {
  benefit: BenefitPackage | null;
  telemetry: BenefitUsageTelemetry | null;
  organizationName?: string;
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any }> = {
  gym: { label: 'Fitness Clubs', icon: Dumbbell },
  pool: { label: 'Olympic Pools', icon: Waves },
  studio: { label: 'Yoga & Studios', icon: Flame },
  clinic: { label: 'Physiotherapy', icon: HeartPulse },
  wellness_center: { label: 'Spa & Sauna', icon: Sparkles },
  sports: { label: 'Sports Courts', icon: Dumbbell },
};

export function ActiveBenefitCard({
  benefit,
  telemetry,
  organizationName = 'Bank of Kigali',
  onSelectCategory,
}: ActiveBenefitCardProps) {
  const planTitle = telemetry?.name || benefit?.name || 'Standard Corporate Tier';
  const maxVisits = telemetry?.maxMonthlyVisits ?? benefit?.max_monthly_visits ?? 12;
  const usedVisits = telemetry?.usedVisits ?? 8;
  const remainingVisits = telemetry?.remainingVisits ?? (maxVisits - usedVisits);
  const isUnlimited = telemetry?.isUnlimited ?? false;
  const isFullySponsored = telemetry?.isFullySponsored ?? benefit?.is_fully_sponsored ?? true;
  const subsidyPct = telemetry?.subsidyPercentage ?? benefit?.subsidy_percentage ?? 100;
  const coPayPct = telemetry?.coPayPercentage ?? benefit?.co_pay_percentage ?? 0;
  const daysRemaining = telemetry?.daysRemainingInCycle ?? 28;
  const allowedCategories = telemetry?.allowedCategories || benefit?.allowed_categories || [
    'gym',
    'pool',
    'studio',
    'clinic',
    'wellness_center',
  ];

  // Percentage for progress bar
  const progressRatio = isUnlimited ? 0 : Math.min(1, usedVisits / Math.max(1, maxVisits));
  const progressPct = Math.round(progressRatio * 100);
  const isLowQuota = !isUnlimited && typeof remainingVisits === 'number' && remainingVisits <= 2;

  return (
    <View style={styles.card}>
      {/* Plan Header */}
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <Text style={styles.subHeading}>ACTIVE CORPORATE BENEFIT</Text>
          <Text style={styles.planTitle} numberOfLines={2}>
            {planTitle}
          </Text>
        </View>

        <View style={styles.statusPill}>
          <CheckCircle2 size={12} color="#0B1F33" />
          <Text style={styles.statusPillText}>ACTIVE</Text>
        </View>
      </View>

      {/* Quota Telemetry Section */}
      <View style={styles.telemetryBox}>
        <View style={styles.telemetryHeader}>
          <View>
            <Text style={styles.quotaNumber}>
              {isUnlimited ? (
                'Unlimited'
              ) : (
                <>
                  <Text style={styles.highlightVal}>{remainingVisits}</Text>
                  <Text style={styles.totalVal}> of {maxVisits} left</Text>
                </>
              )}
            </Text>
            <Text style={styles.quotaSub}>
              {usedVisits} verified visits used this billing cycle
            </Text>
          </View>

          {isLowQuota && (
            <View style={styles.warningChip}>
              <AlertCircle size={12} color={Palette.warningText} />
              <Text style={styles.warningChipText}>Low quota</Text>
            </View>
          )}
        </View>

        {/* High-Contrast Progress Bar */}
        {!isUnlimited && (
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPct}%` },
                progressPct >= 90 && { backgroundColor: '#F59E0B' },
              ]}
            />
          </View>
        )}

        {/* Renewal & Reset Indicator */}
        <View style={styles.resetRow}>
          <View style={styles.resetItem}>
            <Calendar size={13} color={Palette.textMuted} />
            <Text style={styles.resetText}>
              Resets 1st of next month ({daysRemaining} days remaining)
            </Text>
          </View>
        </View>
      </View>

      {/* Corporate Subsidy Breakdown (The Anti-Anxiety Block) */}
      <View style={styles.subsidySection}>
        <View style={styles.subsidyHeader}>
          <ShieldCheck size={14} color={Palette.green} />
          <Text style={styles.subsidyTitle}>Employer Sponsorship & Payroll Status</Text>
        </View>

        <View style={styles.subsidyMetrics}>
          <View style={styles.subsidyMetricItem}>
            <Text style={styles.subsidyVal}>{subsidyPct}%</Text>
            <Text style={styles.subsidyLabel}>Employer Funded</Text>
          </View>
          <View style={styles.subsidyDivider} />
          <View style={styles.subsidyMetricItem}>
            <Text style={[styles.subsidyVal, { color: isFullySponsored ? Palette.green : '#F59E0B' }]}>
              {isFullySponsored ? '0 RWF' : `${coPayPct}% Co-Pay`}
            </Text>
            <Text style={styles.subsidyLabel}>Payroll Deduction</Text>
          </View>
        </View>

        <Text style={styles.subsidyReassurance}>
          {isFullySponsored
            ? `Your wellness benefit is 100% sponsored by ${organizationName}. There are no payroll deductions or out-of-pocket facility entry fees.`
            : `Your corporate plan is subsidized by ${organizationName} at ${subsidyPct}%. Standard monthly co-pay of ${coPayPct}% applies.`}
        </Text>
      </View>

      {/* Allowed Network Access Categories */}
      <View style={styles.categoriesSection}>
        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>Included Provider Facilities</Text>
          <Text style={styles.categoriesHint}>Tap to explore nearby</Text>
        </View>

        <View style={styles.categoryChipsGrid}>
          {allowedCategories.map((catKey) => {
            const meta = CATEGORY_MAP[catKey] || { label: catKey, icon: Dumbbell };
            const IconComponent = meta.icon;
            return (
              <Pressable
                key={catKey}
                style={({ pressed }) => [
                  styles.categoryChip,
                  pressed && styles.categoryChipPressed,
                ]}
                onPress={() => onSelectCategory && onSelectCategory(catKey)}
              >
                <IconComponent size={13} color={Palette.teal} />
                <Text style={styles.categoryChipLabel}>{meta.label}</Text>
                <ChevronRight size={11} color={Palette.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleColumn: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  subHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0B1F33',
    letterSpacing: 0.5,
  },

  // Quota Telemetry
  telemetryBox: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  highlightVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.green,
    fontFamily: 'monospace',
  },
  totalVal: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  quotaSub: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 2,
  },
  warningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningChipText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Palette.green,
    borderRadius: 4,
  },
  resetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  resetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetText: {
    fontSize: 11,
    color: Palette.textMuted,
  },

  // Corporate Subsidy Breakdown
  subsidySection: {
    backgroundColor: '#071521',
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.15)',
  },
  subsidyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subsidyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subsidyMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2235',
    borderRadius: Radius.sm,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  subsidyMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  subsidyDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  subsidyVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  subsidyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textMuted,
    textTransform: 'uppercase',
  },
  subsidyReassurance: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },

  // Allowed Categories
  categoriesSection: {
    gap: Spacing.two,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoriesHint: {
    fontSize: 10,
    color: Palette.teal,
    fontWeight: '600',
  },
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D2235',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipPressed: {
    backgroundColor: 'rgba(0, 210, 180, 0.12)',
    borderColor: Palette.teal,
  },
  categoryChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
});
