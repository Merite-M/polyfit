/**
 * PolyFit Corporate Wellness Network - Discovery Types (PF-100)
 * B2B2C Aggregator Model: Provider Facilities, Geolocation & Plan Eligibility
 */

export type ProviderCategory =
  | 'gym'
  | 'pool'
  | 'studio'
  | 'clinic'
  | 'wellness_center'
  | 'sports';

export interface DayOperatingHours {
  open: string;  // e.g. "06:00"
  close: string; // e.g. "22:00"
}

export type WeeklyOperatingHours = {
  [day in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']?: DayOperatingHours | null;
};

export interface OperatingStatus {
  isOpen: boolean;
  is24Hours?: boolean;
  statusText: string;      // e.g. "Open Now • Closes 10:00 PM"
  statusBadge: 'open' | 'closing_soon' | 'closed';
}

export interface FacilityAmenityInfo {
  id: string;
  name: string;
  iconName: string;
}

export interface DiscoveredFacility {
  location_id: string;
  location_name: string;
  address: string;
  city: string;
  country: string;
  neighborhood: string;
  lat: number | null;
  lng: number | null;
  distance_meters: number | null;
  distance_km: number | null;
  operating_hours: WeeklyOperatingHours | null;
  amenities: string[];
  photos: string[];
  metadata?: Record<string, any>;
  capacity?: number | null;
  provider: {
    id: string;
    name: string;
    category: ProviderCategory;
    rating: number;
    contact_email?: string;
  };
  isIncludedInPlan?: boolean;
  requiredTier?: string;
}

export interface DiscoveryFilterState {
  category: ProviderCategory | 'all';
  neighborhood: string | 'all';
  searchQuery: string;
  amenities: string[];
  openNowOnly: boolean;
  openEarlyOnly: boolean;
  openLateOnly: boolean;
  includedInPlanOnly: boolean;
  sortBy: 'distance' | 'rating' | 'name';
}

export type DiscoveryViewMode = 'map' | 'list';
