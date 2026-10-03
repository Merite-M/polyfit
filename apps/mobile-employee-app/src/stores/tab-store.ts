/**
 * PolyFit Corporate Employee App - Global Tab Navigation Store
 * Enables seamless inter-tab switching (e.g. Explore Tab -> Pass Tab with selected facility)
 */

import { create } from 'zustand';
import { DiscoveredFacility } from '@/types/discovery';

export type ActiveTab = 'pass' | 'explore' | 'profile';

interface TabState {
  activeTab: ActiveTab;
  preselectedFacility: DiscoveredFacility | null;
  setActiveTab: (tab: ActiveTab) => void;
  navigateToPassWithFacility: (facility: DiscoveredFacility) => void;
  clearPreselectedFacility: () => void;
}

export const useTabStore = create<TabState>((set) => ({
  activeTab: 'pass',
  preselectedFacility: null,
  setActiveTab: (tab: ActiveTab) => set({ activeTab: tab }),
  navigateToPassWithFacility: (facility: DiscoveredFacility) =>
    set({
      activeTab: 'pass',
      preselectedFacility: facility,
    }),
  clearPreselectedFacility: () => set({ preselectedFacility: null }),
}));
