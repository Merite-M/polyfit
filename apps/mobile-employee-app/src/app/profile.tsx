/**
 * PolyFit Corporate Employee App - Tab 3: Profile & Benefit Status (PF-102)
 * Compliant with Stitch Design System v1.0 and PolyFit Aggregator Architecture
 * 5-second clarity, transparent corporate subsidy breakdown, verified receipts, and direct concierge
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Pressable,
} from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { useTabStore } from '@/stores/tab-store';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { ProviderCategory } from '@/types/discovery';
import { VerifiedVisitReceipt } from '@/types/auth';

// Subcomponents
import { BeneficiaryHeader } from '@/components/profile/beneficiary-header';
import { ActiveBenefitCard } from '@/components/profile/active-benefit-card';
import { RecentVisitsList } from '@/components/profile/recent-visits-list';
import { VisitReceiptModal } from '@/components/profile/visit-receipt-modal';
import { SupportModal } from '@/components/profile/support-modal';
import { SettingsSection } from '@/components/profile/settings-section';

export default function ProfileScreen() {
  const {
    employee,
    organization,
    benefit,
    benefitTelemetry,
    recentVisits,
    notificationSettings,
    isRefreshingProfile,
    refreshProfileAndVisits,
    updateNotificationSettings,
    loadDemoAccount,
    logout,
  } = useAuthStore();

  const { setActiveTab } = useTabStore();
  const { setSelectedCategory } = useDiscoveryStore();

  const [selectedVisit, setSelectedVisit] = useState<VerifiedVisitReceipt | null>(null);
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);

  // Initial fetch on mount
  useEffect(() => {
    refreshProfileAndVisits().catch(() => {});
  }, []);

  // Handle category chip click -> deep-link to Tab 2 (Explore)
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category as ProviderCategory);
    setActiveTab('explore');
  };

  // Handle open pass click from empty state -> deep-link to Tab 1 (Pass)
  const handleOpenPass = () => {
    setActiveTab('pass');
  };

  // Handle visit selection -> open verified receipt modal
  const handleSelectVisit = (visit: VerifiedVisitReceipt) => {
    setSelectedVisit(visit);
    setIsReceiptModalVisible(true);
  };

  const orgName = organization?.name || 'Bank of Kigali';
  const orgDomain = organization?.domain || 'bk.rw';
  const employeeName = employee?.full_name || 'Jean Mugisha';

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleColumn}>
          <Text style={styles.headerTitle}>Profile & Benefit</Text>
          <Text style={styles.headerSub}>Corporate credentials & visit allowance</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.refreshBtn,
            pressed && { opacity: 0.7, transform: [{ rotate: '45deg' }] },
          ]}
          onPress={() => refreshProfileAndVisits()}
          disabled={isRefreshingProfile}
          hitSlop={8}
        >
          <RefreshCw
            size={16}
            color={isRefreshingProfile ? Palette.green : Palette.textMuted}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingProfile}
            onRefresh={refreshProfileAndVisits}
            tintColor={Palette.green}
            colors={[Palette.green]}
          />
        }
      >
        {/* 1. Beneficiary Identity Header */}
        <BeneficiaryHeader employee={employee} organization={organization} />

        {/* 2. Active Corporate Benefit Card */}
        <ActiveBenefitCard
          benefit={benefit}
          telemetry={benefitTelemetry}
          organizationName={orgName}
          onSelectCategory={handleSelectCategory}
        />

        {/* 3. Recent Verified Activity List */}
        <RecentVisitsList
          visits={recentVisits}
          onSelectVisit={handleSelectVisit}
          onOpenPass={handleOpenPass}
        />

        {/* 4. Settings & Account Section */}
        <SettingsSection
          settings={notificationSettings}
          currentOrgDomain={orgDomain}
          onUpdateSettings={updateNotificationSettings}
          onOpenSupport={() => setIsSupportModalVisible(true)}
          onSwitchTenant={loadDemoAccount}
          onLogout={logout}
        />
      </ScrollView>

      {/* Verified Visit Receipt Modal */}
      <VisitReceiptModal
        visible={isReceiptModalVisible}
        visit={selectedVisit}
        organizationName={orgName}
        onClose={() => {
          setIsReceiptModalVisible(false);
          setSelectedVisit(null);
        }}
      />

      {/* Corporate Support & FAQs Sheet */}
      <SupportModal
        visible={isSupportModalVisible}
        employeeName={employeeName}
        organizationName={orgName}
        onClose={() => setIsSupportModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071521',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  headerTitleColumn: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0B1F33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: Platform.OS === 'ios' ? 90 : 80,
  },
});
