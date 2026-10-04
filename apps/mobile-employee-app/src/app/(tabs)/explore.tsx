/**
 * PolyFit Corporate Employee App - Tab 2: Provider Discovery & Network Explorer (PF-100)
 * B2B2C Corporate Wellness Aggregator (Rwanda, Kenya, East Africa)
 * Interactive Map View ↔ Low-Bandwidth List View, Multi-Category Taxonomy,
 * Dynamic Open/Closed Engine, Plan Tier Badges, and Facility Detail Sheet.
 * Compliant with expo-native-ui, expo-animation, and vercel-react-native-skills.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import {
  Search,
  SlidersHorizontal,
  Map,
  List,
  RotateCcw,
  WifiOff,
  X,
  Compass,
  Frown,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { ProviderCategory, DiscoveredFacility } from '@/types/discovery';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTabStore } from '@/stores/tab-store';
import { ScreenContainer } from '@/components/common/screen-container';
import { Skeleton } from '@/components/common/skeleton';
import { FacilityCard } from '@/components/explore/facility-card';
import { InteractiveMapView } from '@/components/explore/interactive-map-view';
import { FilterBottomSheet } from '@/components/explore/filter-bottom-sheet';
import { FacilityDetailSheet } from '@/components/explore/facility-detail-sheet';

const CATEGORIES: { id: ProviderCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'gym', label: 'Fitness' },
  { id: 'pool', label: 'Swimming' },
  { id: 'studio', label: 'Yoga & Pilates' },
  { id: 'wellness_center', label: 'Spa & Sauna' },
  { id: 'sports', label: 'Sports & Padel' },
];

const NEIGHBORHOODS = [
  'All',
  'Kimihurura',
  'Kiyovu',
  'Nyarutarama',
  'Gishushu',
  'Downtown',
  'Remera',
];

export default function ExploreNetworkScreen() {
  const router = useRouter();
  const { benefit } = useAuthStore();
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [detailFacility, setDetailFacility] = useState<DiscoveredFacility | null>(null);

  const {
    facilities,
    isLoading,
    isOffline,
    searchQuery,
    selectedCategory,
    selectedNeighborhood,
    viewMode,
    includedInPlanOnly,
    userLocation,
    loadFacilities,
    setSearchQuery,
    setSelectedCategory,
    setSelectedNeighborhood,
    setViewMode,
    resetFilters,
    activeFilterCount,
    selectedAmenities,
  } = useDiscoveryStore();

  const { navigateToPassWithFacility } = useTabStore();

  const handleOpenDirections = (fac: DiscoveredFacility) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (!fac.lat || !fac.lng) {
      const query = encodeURIComponent(`${fac.location_name}, Kigali, Rwanda`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      return;
    }
    const { lat, lng } = fac;
    const url =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${lat},${lng}&q=${encodeURIComponent(fac.location_name)}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const handleQuickCheckIn = (fac: DiscoveredFacility) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    navigateToPassWithFacility(fac);
    router.push({
      pathname: '/(tabs)' as any,
      params: {
        facilityId: fac.location_id,
        facilityName: fac.location_name,
      },
    });
  };

  // Load facilities on initial mount with employee's allowed corporate categories
  useEffect(() => {
    loadFacilities(benefit?.allowed_categories);
  }, [loadFacilities, benefit?.allowed_categories]);

  // Filter facilities based on active filters
  const filteredFacilities = useMemo(() => {
    return facilities.filter((fac) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && fac.provider.category !== selectedCategory) {
        return false;
      }

      // 2. Neighborhood Filter
      if (
        selectedNeighborhood !== 'All' &&
        selectedNeighborhood !== 'all' &&
        fac.neighborhood.toLowerCase() !== selectedNeighborhood.toLowerCase()
      ) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = fac.location_name.toLowerCase().includes(q);
        const matchesNeighborhood = fac.neighborhood.toLowerCase().includes(q);
        const matchesAddress = fac.address.toLowerCase().includes(q);
        const matchesProvider = fac.provider.name.toLowerCase().includes(q);
        const matchesAmenity = fac.amenities.some((a) => a.toLowerCase().includes(q));

        if (!matchesName && !matchesNeighborhood && !matchesAddress && !matchesProvider && !matchesAmenity) {
          return false;
        }
      }

      // 4. Plan Eligibility Filter
      if (includedInPlanOnly && fac.isIncludedInPlan === false) {
        return false;
      }

      // 5. Amenities Filter
      if (selectedAmenities.length > 0) {
        const facAmenities = fac.amenities.map((a) => a.toLowerCase());
        const hasAll = selectedAmenities.every((req) => facAmenities.some((a) => a.includes(req.toLowerCase())));
        if (!hasAll) return false;
      }

      return true;
    });
  }, [
    facilities,
    selectedCategory,
    selectedNeighborhood,
    searchQuery,
    includedInPlanOnly,
    selectedAmenities,
  ]);

  const filterCount = activeFilterCount();

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Partner Network</Text>
            <Text style={styles.headerSub}>
              {filteredFacilities.length} verified facilities in your corporate plan
            </Text>
          </View>

          {/* View Mode Segmented Control (Map <-> List) */}
          <View style={styles.segmentedControl}>
            <Pressable
              style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                setViewMode('list');
              }}
              accessibilityRole="button"
              accessibilityLabel="List view mode"
            >
              <List size={15} color={viewMode === 'list' ? Palette.green : Palette.textMuted} />
              <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>
                List
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentBtn, viewMode === 'map' && styles.segmentBtnActive]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                setViewMode('map');
              }}
              accessibilityRole="button"
              accessibilityLabel="Map view mode"
            >
              <Map size={15} color={viewMode === 'map' ? Palette.green : Palette.textMuted} />
              <Text style={[styles.segmentText, viewMode === 'map' && styles.segmentTextActive]}>
                Map
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Offline Alert Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={13} color="#F59E0B" />
            <Text style={styles.offlineBannerText}>
              Browsing cached partner network • Offline mode active
            </Text>
          </View>
        )}

        {/* Search Bar & Filter Trigger */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={16} color={Palette.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search facilities, pools, classes..."
              placeholderTextColor={Palette.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <X size={15} color={Palette.textMuted} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.filterBtn, filterCount > 0 && styles.filterBtnActive]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setFilterSheetVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Filter options. ${filterCount} active filters.`}
          >
            <SlidersHorizontal
              size={17}
              color={filterCount > 0 ? '#0B1F33' : Palette.textInverse}
            />
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Category Horizontal Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                  setSelectedCategory(cat.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${cat.label} category filter`}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Neighborhood Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.neighborhoodScroll}
          contentContainerStyle={styles.neighborhoodContent}
        >
          {NEIGHBORHOODS.map((hood) => {
            const isSelected = selectedNeighborhood.toLowerCase() === hood.toLowerCase();
            return (
              <Pressable
                key={hood}
                style={[styles.hoodPill, isSelected && styles.hoodPillActive]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                  setSelectedNeighborhood(hood);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${hood} neighborhood filter`}
              >
                <Text style={[styles.hoodPillText, isSelected && styles.hoodPillTextActive]}>
                  {hood}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Main Content Area */}
        {isLoading ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <Skeleton height={140} borderRadius={Radius.card} style={{ marginBottom: Spacing.three }} />
            <Skeleton height={140} borderRadius={Radius.card} style={{ marginBottom: Spacing.three }} />
            <Skeleton height={140} borderRadius={Radius.card} style={{ marginBottom: Spacing.three }} />
          </ScrollView>
        ) : viewMode === 'map' ? (
          <InteractiveMapView
            facilities={filteredFacilities}
            userLocation={userLocation}
            selectedFacility={detailFacility}
            onSelectFacility={(fac) => {
              if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
              setDetailFacility(fac);
            }}
          />
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => loadFacilities(benefit?.allowed_categories)}
                tintColor={Palette.green}
                colors={[Palette.green]}
              />
            }
          >
            {filteredFacilities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Compass size={32} color={Palette.teal} />
                </View>
                <Text style={styles.emptyTitle}>No facilities found</Text>
                <Text style={styles.emptySub}>
                  No partner wellness locations match your active search or filters.
                </Text>
                <Pressable
                  style={styles.emptyResetBtn}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    resetFilters();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Reset all filters"
                >
                  <RotateCcw size={15} color="#0B1F33" />
                  <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
                </Pressable>
              </View>
            ) : (
              filteredFacilities.map((fac) => (
                <FacilityCard
                  key={fac.location_id}
                  facility={fac}
                  onPress={(f) => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                    setDetailFacility(f);
                  }}
                  onQuickCheckIn={(f) => handleQuickCheckIn(f)}
                  onOpenDirections={(f) => handleOpenDirections(f)}
                />
              ))
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Filter Bottom Sheet Modal */}
      <FilterBottomSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
      />

      {/* Facility Detail Sheet Modal */}
      <FacilityDetailSheet
        facility={detailFacility}
        visible={!!detailFacility}
        onClose={() => setDetailFacility(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#0B1F33',
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  segmentTextActive: {
    color: Palette.green,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  offlineBannerText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.two,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0B1F33',
    borderRadius: Radius.btn,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.btn,
    backgroundColor: '#0B1F33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: Palette.green,
    borderColor: Palette.green,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0B1F33',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Palette.green,
  },
  filterBadgeText: {
    color: Palette.green,
    fontSize: 10,
    fontWeight: '800',
  },
  categoryScroll: {
    maxHeight: 40,
    marginBottom: 6,
  },
  categoryContent: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#0B1F33',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(40, 209, 124, 0.18)',
    borderColor: Palette.green,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  categoryPillTextActive: {
    color: Palette.green,
    fontWeight: '700',
  },
  neighborhoodScroll: {
    maxHeight: 34,
    marginBottom: Spacing.two,
  },
  neighborhoodContent: {
    gap: 6,
  },
  hoodPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  hoodPillActive: {
    backgroundColor: 'rgba(0, 210, 180, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 180, 0.3)',
  },
  hoodPillText: {
    fontSize: 11,
    color: Palette.textMuted,
  },
  hoodPillTextActive: {
    color: Palette.teal,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.eight,
    gap: Spacing.three,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.seven,
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 210, 180, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.green,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: Radius.btn,
    marginTop: Spacing.three,
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B1F33',
  },
});
