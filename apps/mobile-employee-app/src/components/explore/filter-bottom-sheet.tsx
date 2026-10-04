/**
 * PolyFit Corporate Employee App - Advanced Filter Bottom Sheet (PF-100)
 * Allows corporate employees to filter by amenities, operating hours, and plan eligibility
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { AppModal } from '@/components/common/app-modal';
import {
  X,
  RotateCcw,
  Check,
  Car,
  ShowerHead,
  Waves,
  Flame,
  Lock,
  Sparkles,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { useDiscoveryStore } from '@/stores/discovery-store';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

const AVAILABLE_AMENITIES = [
  { id: 'parking', label: 'Free Parking', icon: Car },
  { id: 'shower', label: 'Hot Showers', icon: ShowerHead },
  { id: 'locker', label: 'Locker Rooms', icon: Lock },
  { id: 'sauna', label: 'Sauna & Steam Room', icon: Flame },
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'towel', label: 'Towel Service', icon: Sparkles },
  { id: 'reformer', label: 'Pilates Reformer', icon: Sparkles },
];

export function FilterBottomSheet({ visible, onClose }: FilterBottomSheetProps) {
  const {
    selectedAmenities,
    toggleAmenity,
    openNowOnly,
    setOpenNowOnly,
    openEarlyOnly,
    setOpenEarlyOnly,
    openLateOnly,
    setOpenLateOnly,
    includedInPlanOnly,
    setIncludedInPlanOnly,
    resetFilters,
    activeFilterCount,
  } = useDiscoveryStore();

  const count = activeFilterCount();

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Handlebar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Filter Facilities</Text>
              {count > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{count}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {count > 0 && (
                <Pressable style={styles.resetBtn} onPress={resetFilters}>
                  <RotateCcw size={13} color={Palette.textMuted} />
                  <Text style={styles.resetBtnText}>Reset</Text>
                </Pressable>
              )}
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <X size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Scrollable Filters Content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Plan Eligibility */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plan Eligibility</Text>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <View style={styles.switchTitleRow}>
                    <ShieldCheck size={16} color={Palette.green} />
                    <Text style={styles.switchTitle}>Included in my Plan only</Text>
                  </View>
                  <Text style={styles.switchSubtitle}>
                    Hide facilities requiring tier upgrades or co-pays
                  </Text>
                </View>
                <Switch
                  value={includedInPlanOnly}
                  onValueChange={setIncludedInPlanOnly}
                  trackColor={{ false: '#1A334B', true: Palette.green }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Section 2: Operating Hours */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Operating Hours</Text>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <View style={styles.switchTitleRow}>
                    <Clock size={15} color={Palette.teal} />
                    <Text style={styles.switchTitle}>Open Now</Text>
                  </View>
                  <Text style={styles.switchSubtitle}>Currently accepting visitors right now</Text>
                </View>
                <Switch
                  value={openNowOnly}
                  onValueChange={setOpenNowOnly}
                  trackColor={{ false: '#1A334B', true: Palette.green }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>Open Early (Before 7:00 AM)</Text>
                  <Text style={styles.switchSubtitle}>Ideal for pre-work corporate sessions</Text>
                </View>
                <Switch
                  value={openEarlyOnly}
                  onValueChange={setOpenEarlyOnly}
                  trackColor={{ false: '#1A334B', true: Palette.green }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>Open Late (After 9:00 PM)</Text>
                  <Text style={styles.switchSubtitle}>Evening access after business hours</Text>
                </View>
                <Switch
                  value={openLateOnly}
                  onValueChange={setOpenLateOnly}
                  trackColor={{ false: '#1A334B', true: Palette.green }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Section 3: Amenities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities & Features</Text>
              <View style={styles.amenitiesGrid}>
                {AVAILABLE_AMENITIES.map((item) => {
                  const isSelected = selectedAmenities.includes(item.id);
                  const IconComponent = item.icon;
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.amenityFilterChip,
                        isSelected && styles.amenityFilterChipSelected,
                      ]}
                      onPress={() => toggleAmenity(item.id)}
                    >
                      <IconComponent
                        size={15}
                        color={isSelected ? '#0B1F33' : Palette.textMuted}
                      />
                      <Text
                        style={[
                          styles.amenityFilterText,
                          isSelected && styles.amenityFilterTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Check size={14} color="#0B1F33" strokeWidth={3} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Apply Button */}
          <View style={styles.footerBar}>
            <Pressable style={styles.applyBtn} onPress={onClose}>
              <Text style={styles.applyBtnText}>
                {count > 0 ? `Show Results (${count} Filters)` : 'Show All Facilities'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dismissOverlay: {
    flex: 1,
    width: '100%',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#0B1F33',
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...Platform.select({
      web: {
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.6)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 16,
      },
    }),
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: Palette.green,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0B1F33',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetBtnText: {
    fontSize: 12,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: Spacing.four,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0D2235',
    padding: 12,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  switchInfo: {
    flex: 1,
    marginRight: 10,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchSubtitle: {
    fontSize: 11,
    color: Palette.textMuted,
  },

  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D2235',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  amenityFilterChipSelected: {
    backgroundColor: Palette.green,
    borderColor: Palette.green,
  },
  amenityFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  amenityFilterTextSelected: {
    color: '#0B1F33',
    fontWeight: '800',
  },

  footerBar: {
    paddingHorizontal: Spacing.four,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  applyBtn: {
    backgroundColor: Palette.green,
    height: 48,
    borderRadius: Radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B1F33', // Strictly Midnight Navy on Green!
    letterSpacing: 0.2,
  },
});
