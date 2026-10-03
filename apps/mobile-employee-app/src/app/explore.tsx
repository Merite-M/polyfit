/**
 * PolyFit Corporate Employee App - Tab 2: Provider Discovery & Network Explorer (PF-100)
 * B2B2C Corporate Wellness Aggregator (Rwanda, Kenya, East Africa)
 * Interactive Map View ↔ Low-Bandwidth List View, Multi-Category Taxonomy,
 * Dynamic Open/Closed Engine, Plan Tier Badges, and Facility Detail Sheet.
 * Compliant with expo-native-ui, expo-animation, and vercel-react-native-skills.
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Search,
  SlidersHorizontal,
  Map,
  List,
  RotateCcw,
  WifiOff,
  X,
  Compass,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { ProviderCategory } from '@/types/discovery';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { useAuthStore } from '@/stores/auth-store';
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
  const { benefit } = useAuthStore();
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedNeighborhood,
    setSelectedNeighborhood,
    facilities,
    isLoading,
    isOffline,
    selectedFacility,
    selectFacility,
    isDetailModalVisible,
    openDetailModal,
    closeDetailModal,
    isFilterSheetVisible,
    setFilterSheetVisible,
    activeFilterCount,
    resetFilters,
    loadFacilities,
    userLocation,
    openNowOnly,
    openEarlyOnly,
    openLateOnly,
    includedInPlanOnly,
    selectedAmenities,
  } = useDiscoveryStore();

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
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Partner Network</Text>
          <Text style={styles.headerSub}>
            {filteredFacilities.length} verified facilities in your corporate plan
          </Text>
        </View>

        {/* View Mode Segmented Control (Map ↔ List) */}
        <View style={styles.segmentedControl}>
          <Pressable
            style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={15} color={viewMode === 'list' ? Palette.green : Palette.textMuted} />
            <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>
              List
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, viewMode === 'map' && styles.segmentBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Map size={15} color={viewMode === 'map' ? Palette.green : Palette.textMuted} />
            <Text style={[styles.segmentText, viewMode === 'map' && styles.segmentTextActive]}>
              Map
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Offline Alert Banner (East Africa Resilience) */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={13} color="#F59E0B" />
          <Text style={styles.offlineBannerText}>
            Browsing cached partner network • Offline mode active
          </Text>
        </View>
      )}

      {/* Search Bar & Advanced Filter Trigger */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={Palette.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search facility, neighborhood, or amenity..."
            placeholderTextColor={Palette.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color={Palette.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter Trigger Button */}
        <Pressable
          style={[styles.filterTriggerBtn, filterCount > 0 && styles.filterTriggerBtnActive]}
          onPress={() => setFilterSheetVisible(true)}
        >
          <SlidersHorizontal
            size={16}
            color={filterCount > 0 ? '#0B1F33' : '#FFFFFF'}
          />
          {filterCount > 0 && (
            <View style={styles.filterDot}>
              <Text style={styles.filterDotText}>{filterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Horizontal Sticky Category Pills */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Neighborhood Quick Chips */}
      <View style={styles.neighborhoodsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.neighborhoodsScroll}
        >
          {NEIGHBORHOODS.map((nh) => {
            const isActive =
              (nh === 'All' && selectedNeighborhood === 'all') ||
              selectedNeighborhood === nh;
            return (
              <Pressable
                key={nh}
                style={[
                  styles.neighborhoodChip,
                  isActive && styles.neighborhoodChipActive,
                ]}
                onPress={() => setSelectedNeighborhood(nh === 'All' ? 'all' : nh)}
              >
                <Text
                  style={[
                    styles.neighborhoodChipText,
                    isActive && styles.neighborhoodChipTextActive,
                  ]}
                >
                  {nh}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Viewport: Interactive Map vs High-Performance List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.green} />
          <Text style={styles.loadingText}>Syncing partner directory...</Text>
        </View>
      ) : viewMode === 'map' ? (
        <ScrollView
          style={styles.viewportScroll}
          contentContainerStyle={styles.mapViewportContent}
          showsVerticalScrollIndicator={false}
        >
          <InteractiveMapView
            facilities={filteredFacilities}
            userLocation={userLocation}
            selectedFacility={selectedFacility}
            onSelectFacility={(fac) => {
              if (fac) {
                openDetailModal(fac);
              } else {
                selectFacility(null);
              }
            }}
          />

          {/* Quick List Preview Under Map */}
          <Text style={styles.underMapHeader}>Nearby in {selectedNeighborhood === 'all' ? 'Kigali' : selectedNeighborhood}</Text>
          {filteredFacilities.slice(0, 3).map((facility) => (
            <FacilityCard
              key={facility.location_id}
              facility={facility}
              onPress={openDetailModal}
            />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.viewportScroll}
          contentContainerStyle={styles.listViewportContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredFacilities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Compass size={28} color={Palette.teal} />
              </View>
              <Text style={styles.emptyTitle}>No matching facilities found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query, expanding the neighborhood, or clearing your active filters.
              </Text>
              <Pressable style={styles.resetFiltersBtn} onPress={resetFilters}>
                <RotateCcw size={14} color="#0B1F33" />
                <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
              </Pressable>
            </View>
          ) : (
            filteredFacilities.map((facility) => (
              <FacilityCard
                key={facility.location_id}
                facility={facility}
                onPress={openDetailModal}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Advanced Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={isFilterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
      />

      {/* Facility Detail Sheet / Modal */}
      <FacilityDetailSheet
        facility={selectedFacility}
        visible={isDetailModalVisible}
        onClose={closeDetailModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071521',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },

  // Header & Segmented Control
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  headerTitleGroup: {
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
    color: Palette.textSecondary,
    marginTop: 2,
  },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#0B1F33',
    borderRadius: Radius.btn,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.inner,
  },
  segmentBtnActive: {
    backgroundColor: '#132D43',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  segmentTextActive: {
    color: Palette.green,
    fontWeight: '700',
  },

  // Offline Banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: Spacing.four,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
    marginBottom: Spacing.two,
  },
  offlineBannerText: {
    fontSize: 11,
    color: '#FDE68A',
    fontWeight: '600',
  },

  // Search Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2235',
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  filterTriggerBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.btn,
    backgroundColor: '#0D2235',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterTriggerBtnActive: {
    backgroundColor: Palette.green,
    borderColor: Palette.green,
  },
  filterDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0B1F33',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.green,
  },
  filterDotText: {
    fontSize: 10,
    fontWeight: '900',
    color: Palette.green,
  },

  // Categories Horizontal Bar
  categoriesWrapper: {
    marginBottom: Spacing.one,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#0B1F33',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    borderColor: Palette.green,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  categoryPillTextActive: {
    color: Palette.green,
    fontWeight: '800',
  },

  // Neighborhoods Quick Bar
  neighborhoodsWrapper: {
    marginBottom: Spacing.two,
  },
  neighborhoodsScroll: {
    paddingHorizontal: Spacing.four,
    gap: 6,
  },
  neighborhoodChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  neighborhoodChipActive: {
    backgroundColor: 'rgba(0, 210, 180, 0.15)',
  },
  neighborhoodChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: Palette.textMuted,
  },
  neighborhoodChipTextActive: {
    color: Palette.teal,
    fontWeight: '700',
  },

  // Viewport Container
  viewportScroll: {
    flex: 1,
  },
  mapViewportContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  listViewportContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  underMapHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 6,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  loadingText: {
    fontSize: 13,
    color: Palette.textMuted,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 210, 180, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.btn,
    marginTop: 6,
  },
  resetFiltersBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B1F33',
  },
});
