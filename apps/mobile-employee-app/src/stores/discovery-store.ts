/**
 * PolyFit Corporate Employee App - Discovery State Store (Zustand)
 * Manages search, filters, map/list viewports, live facilities cache, and facility detail sheets
 */

import { create } from 'zustand';
import {
  DiscoveredFacility,
  ProviderCategory,
  DiscoveryViewMode,
} from '@/types/discovery';
import { DiscoveryService } from '@/services/discovery-service';

interface DiscoveryState {
  viewMode: DiscoveryViewMode;
  searchQuery: string;
  selectedCategory: ProviderCategory | 'all';
  selectedNeighborhood: string | 'all';
  selectedAmenities: string[];
  openNowOnly: boolean;
  openEarlyOnly: boolean;
  openLateOnly: boolean;
  includedInPlanOnly: boolean;
  userLocation: { lat: number; lng: number } | null;

  facilities: DiscoveredFacility[];
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;

  selectedFacility: DiscoveredFacility | null;
  isDetailModalVisible: boolean;
  isFilterSheetVisible: boolean;

  // Actions
  setViewMode: (mode: DiscoveryViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ProviderCategory | 'all') => void;
  setSelectedNeighborhood: (neighborhood: string | 'all') => void;
  toggleAmenity: (amenity: string) => void;
  setOpenNowOnly: (val: boolean) => void;
  setOpenEarlyOnly: (val: boolean) => void;
  setOpenLateOnly: (val: boolean) => void;
  setIncludedInPlanOnly: (val: boolean) => void;
  resetFilters: () => void;
  activeFilterCount: () => number;

  selectFacility: (facility: DiscoveredFacility | null) => void;
  openDetailModal: (facility: DiscoveredFacility) => void;
  closeDetailModal: () => void;
  setFilterSheetVisible: (visible: boolean) => void;
  setUserLocation: (loc: { lat: number; lng: number }) => void;

  loadFacilities: (allowedCategories?: string[]) => Promise<void>;
}

// Kigali downtown default coordinates
const DEFAULT_KIGALI_COORDS = { lat: -1.9536, lng: 30.0924 };

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  viewMode: 'list',
  searchQuery: '',
  selectedCategory: 'all',
  selectedNeighborhood: 'all',
  selectedAmenities: [],
  openNowOnly: false,
  openEarlyOnly: false,
  openLateOnly: false,
  includedInPlanOnly: false,
  userLocation: DEFAULT_KIGALI_COORDS,

  facilities: [],
  isLoading: false,
  isOffline: false,
  error: null,

  selectedFacility: null,
  isDetailModalVisible: false,
  isFilterSheetVisible: false,

  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedNeighborhood: (selectedNeighborhood) => set({ selectedNeighborhood }),
  
  toggleAmenity: (amenity: string) => {
    const current = get().selectedAmenities;
    const exists = current.includes(amenity);
    set({
      selectedAmenities: exists
        ? current.filter((a) => a !== amenity)
        : [...current, amenity],
    });
  },

  setOpenNowOnly: (openNowOnly) => set({ openNowOnly }),
  setOpenEarlyOnly: (openEarlyOnly) => set({ openEarlyOnly }),
  setOpenLateOnly: (openLateOnly) => set({ openLateOnly }),
  setIncludedInPlanOnly: (includedInPlanOnly) => set({ includedInPlanOnly }),

  resetFilters: () =>
    set({
      selectedCategory: 'all',
      selectedNeighborhood: 'all',
      selectedAmenities: [],
      openNowOnly: false,
      openEarlyOnly: false,
      openLateOnly: false,
      includedInPlanOnly: false,
      searchQuery: '',
    }),

  activeFilterCount: () => {
    const s = get();
    let count = 0;
    if (s.selectedCategory !== 'all') count++;
    if (s.selectedNeighborhood !== 'all') count++;
    if (s.selectedAmenities.length > 0) count += s.selectedAmenities.length;
    if (s.openNowOnly) count++;
    if (s.openEarlyOnly) count++;
    if (s.openLateOnly) count++;
    if (s.includedInPlanOnly) count++;
    return count;
  },

  selectFacility: (selectedFacility) => set({ selectedFacility }),
  openDetailModal: (facility) =>
    set({ selectedFacility: facility, isDetailModalVisible: true }),
  closeDetailModal: () => set({ isDetailModalVisible: false }),
  setFilterSheetVisible: (isFilterSheetVisible) => set({ isFilterSheetVisible }),
  setUserLocation: (userLocation) => set({ userLocation }),

  loadFacilities: async (allowedCategories) => {
    set({ isLoading: true, error: null });
    const { userLocation, selectedCategory, searchQuery, selectedAmenities } = get();

    try {
      const result = await DiscoveryService.fetchFacilities({
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        category: selectedCategory,
        search: searchQuery,
        amenities: selectedAmenities,
        allowedCategories,
      });

      set({
        facilities: result.facilities,
        isOffline: result.isOffline,
        isLoading: false,
      });
    } catch (e: any) {
      set({
        isLoading: false,
        error: e.message || 'Failed to load facilities',
      });
    }
  },
}));
