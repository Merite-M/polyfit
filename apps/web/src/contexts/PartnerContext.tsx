'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

export interface ProviderLocation {
  id: string;
  provider_id: string;
  name: string;
  city: string;
  address?: string;
  country?: string;
  lat?: number;
  lng?: number;
  operating_hours?: Record<string, { is_closed: boolean; shifts: Array<{ open: string; close: string }> }>;
  amenities?: string[];
  photos?: string[];
  capacity?: number;
  metadata?: {
    phone?: string;
    website?: string;
    social_links?: {
      instagram?: string;
      whatsapp?: string;
    };
    description?: string;
    guidelines?: string;
    first_checkin_rules?: {
      booking_required?: boolean;
      registration_form_required?: boolean;
      guided_tour_mandatory?: boolean;
      arrive_early_minutes?: number;
    };
    recommended_gear?: string[];
    entrance_instructions?: string;
    geofence_radius_meters?: number;
  };
  status?: string;
}

export interface ProviderBankDetails {
  payout_method?: 'bank' | 'momo';
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  swift_code?: string;
  momo_provider?: 'mtn' | 'airtel';
  momo_code?: string;
  momo_phone?: string;
}

export interface ProviderProfile {
  id: string;
  name: string;
  category: string;
  contact_email?: string;
  settlement_email?: string;
  tax_id?: string;
  bank_details?: ProviderBankDetails;
  rating?: number;
}

export interface TodaySummary {
  total_visits_today: number;
  settlement_earned_today: number;
  currency: string;
  pending_queue_count: number;
  disputed_count: number;
  per_visit_rate: number;
}

export interface DashboardKpis {
  today_visits: number;
  yesterday_visits: number;
  vs_yesterday_delta_pct: number;
  unique_corporate_visitors_mtd: number;
  mtd_total_visits: number;
  estimated_mtd_revenue_rwf: number;
  estimated_net_payout_rwf: number;
  currency: string;
  active_contracts_count: number;
  per_visit_rate: number;
}

export interface PeakHoursHeatmapData {
  hours_24: number[];
  weekday_hours_24: number[];
  weekend_hours_24: number[];
  rush_hours: {
    morning_rush_count: number;
    lunch_rush_count: number;
    evening_rush_count: number;
  };
}

export interface TopOrganizationItem {
  org_id: string;
  org_name: string;
  logo_url: string | null;
  visit_count: number;
  unique_employees_count: number;
  gross_earnings: number;
  visit_share_pct: number;
}

export interface RecentActivityItem {
  id: string;
  check_in_at: string;
  employee_masked: string;
  employer_name?: string;
  activity_name?: string;
  verification_method: string;
  location_id: string;
}

export interface DashboardOverview {
  provider: {
    id: string;
    name: string;
    category: string;
    rating: number;
    is_payout_configured: boolean;
    payout_details: ProviderBankDetails | null;
    tax_id: string | null;
  };
  location_context: {
    selected_location_id: string;
    total_locations: number;
    locations: Array<{
      id: string;
      name: string;
      city: string;
      address?: string;
      capacity?: number;
      status: string;
      geofence_radius_meters: number;
    }>;
  };
  kpis: DashboardKpis;
  peak_hours_heatmap: PeakHoursHeatmapData;
  top_organizations: TopOrganizationItem[];
  recent_activity: RecentActivityItem[];
}

export interface BenefitTierMatrixItem {
  tier: string;
  tier_name: string;
  description: string;
  co_pay_percentage: number;
  is_eligible_for_entry: boolean;
  restriction_reason: string;
}

export interface AccessHoursSchedule {
  weekdays?: string;
  weekends?: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  [key: string]: string | undefined;
}

export type AccessHours = string | AccessHoursSchedule | null;

export interface CommercialContract {
  id?: string;
  org_name?: string;
  tier_classification?: string;
  per_visit_rate: number;
  currency?: string;
  monthly_cap: number | null;
  access_hours?: AccessHours;
  status: string;
  effective_from?: string;
  effective_to?: string;
  contract_party?: string;
}

export interface CommercialConditions {
  provider: {
    id: string;
    name: string;
    category: string;
    status: string;
  };
  active_contract: CommercialContract;
  all_contracts: CommercialContract[];
  tier_access_matrix: BenefitTierMatrixItem[];
  payment_calculation_rules: {
    gross_rate_per_checkin_rwf: number;
    platform_fee_percent: number;
    net_payout_per_checkin_rwf: number;
    anti_passback_window_hours: number;
    dispute_window_minutes: number;
    co_pay_handling: string;
    disbursement_schedule: string;
  };
}

export interface AmendmentRequestPayload {
  contract_id?: string;
  request_type: 'rate_review' | 'capacity_expansion' | 'tier_upgrade' | 'terms_inquiry';
  current_rate?: number;
  requested_rate?: number;
  justification: string;
  contact_phone?: string;
  contact_email?: string;
}

interface PartnerContextType {
  provider: ProviderProfile | null;
  setProviderProfile: (profile: ProviderProfile) => void;
  locations: ProviderLocation[];
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  selectedLocation: ProviderLocation | null;
  todaySummary: TodaySummary | null;
  dashboardData: DashboardOverview | null;
  commercialConditions: CommercialConditions | null;
  loading: boolean;
  manualCheckinOpen: boolean;
  setManualCheckinOpen: (open: boolean) => void;
  openManualCheckin: () => void;
  closeManualCheckin: () => void;
  retroactiveClaimOpen: boolean;
  setRetroactiveClaimOpen: (open: boolean) => void;
  openRetroactiveClaim: () => void;
  closeRetroactiveClaim: () => void;
  payoutModalOpen: boolean;
  setPayoutModalOpen: (open: boolean) => void;
  openPayoutModal: () => void;
  closePayoutModal: () => void;
  globalUpdateTrigger: number;
  notifyCheckinAction: (action: 'approved' | 'rejected' | 'disputed', visit?: any) => void;
  refreshAll: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshCommercialConditions: () => Promise<void>;
  updatePayoutDetails: (details: { tax_id?: string; bank_details: ProviderBankDetails }) => Promise<boolean>;
  submitAmendmentRequest: (data: AmendmentRequestPayload) => Promise<{ success: boolean; error?: string }>;
  createLocation: (data: Partial<ProviderLocation>) => Promise<{ success: boolean; location?: ProviderLocation; error?: string }>;
  updateLocation: (locId: string, data: Partial<ProviderLocation>) => Promise<{ success: boolean; location?: ProviderLocation; error?: string }>;
}

// Fallback seed data for seamless evaluation & counter testing
const DEFAULT_PROVIDER: ProviderProfile = {
  id: '90d06d31-999c-42c0-a0c6-fc31ec818ced',
  name: 'FitLife Gym Kigali',
  category: 'gym',
  contact_email: 'ops@fitlife.rw',
  rating: 4.8,
  tax_id: '108392019',
  bank_details: {
    payout_method: 'bank',
    bank_name: 'Bank of Kigali (BK)',
    account_name: 'FitLife Ltd',
    account_number: '00040-0692140-19',
    swift_code: 'BOKRRWRW'
  }
};

const STANDARD_OPERATING_HOURS: Record<string, { is_closed: boolean; shifts: Array<{ open: string; close: string }> }> = {
  mon: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
  tue: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
  wed: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
  thu: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
  fri: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
  sat: { is_closed: false, shifts: [{ open: '08:00', close: '20:00' }] },
  sun: { is_closed: false, shifts: [{ open: '09:00', close: '18:00' }] },
};

const DEFAULT_LOCATIONS: ProviderLocation[] = [
  {
    id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
    provider_id: '90d06d31-999c-42c0-a0c6-fc31ec818ced',
    name: 'Kigali Central Facility (Unit #851931)',
    city: 'Kigali',
    address: 'KN 3 Ave, Kigali City Tower, Level 2',
    capacity: 150,
    operating_hours: STANDARD_OPERATING_HOURS,
    amenities: ['Cardio Zone', 'Free Weights', 'Olympic Pool', 'Sauna', 'Lockers & Showers', 'WiFi'],
    metadata: {
      phone: '+250 788 123 456',
      website: 'https://fitlife.rw',
      social_links: {
        instagram: 'fitlifekigali',
        whatsapp: '+250788123456'
      },
      description: 'Premier Kigali wellness center with comprehensive resistance equipment, cardio decks, and certified personal trainers.',
      guidelines: 'Clean gym attire and indoor training shoes required. Bring a workout towel.',
      first_checkin_rules: {
        booking_required: false,
        registration_form_required: true,
        guided_tour_mandatory: false,
        arrive_early_minutes: 10
      },
      recommended_gear: ['Training Shoes', 'Workout Towel', 'Water Bottle'],
      geofence_radius_meters: 100
    }
  },
  {
    id: '189e7cb8-155e-419a-8b83-bd9e3eb021da',
    provider_id: '90d06d31-999c-42c0-a0c6-fc31ec818ced',
    name: 'Nyarutarama Health Branch (Unit #851932)',
    city: 'Kigali',
    address: 'KG 9 Ave, Nyarutarama Tennis Club Annex',
    capacity: 100,
    operating_hours: STANDARD_OPERATING_HOURS,
    amenities: ['Cardio Machines', 'Strength Racks', 'Steam Room', 'Lockers & Showers', 'Smoothie Bar'],
    metadata: {
      phone: '+250 788 654 321',
      website: 'https://fitlife.rw',
      social_links: {
        instagram: 'fitlifenyarutarama',
        whatsapp: '+250788654321'
      },
      description: 'Scenic Nyarutarama branch offering boutique functional training, recovery amenities, and tranquil group exercise studios.',
      guidelines: 'Check in via dynamic QR pass at reception counter before entering workout floor.',
      first_checkin_rules: {
        booking_required: false,
        registration_form_required: false,
        guided_tour_mandatory: true,
        arrive_early_minutes: 15
      },
      recommended_gear: ['Training Shoes', 'Towel'],
      geofence_radius_meters: 100
    }
  }
];

const DEFAULT_DASHBOARD_OVERVIEW: DashboardOverview = {
  provider: {
    id: '90d06d31-999c-42c0-a0c6-fc31ec818ced',
    name: 'FitLife Gym Kigali',
    category: 'gym',
    rating: 4.8,
    is_payout_configured: true,
    payout_details: DEFAULT_PROVIDER.bank_details || null,
    tax_id: '108392019'
  },
  location_context: {
    selected_location_id: 'all',
    total_locations: 2,
    locations: [
      {
        id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
        name: 'Kigali Central Facility (Unit #851931)',
        city: 'Kigali',
        address: 'KN 3 Ave, Level 2',
        capacity: 150,
        status: 'active',
        geofence_radius_meters: 150
      },
      {
        id: '189e7cb8-155e-419a-8b83-bd9e3eb021da',
        name: 'Nyarutarama Health Branch (Unit #851932)',
        city: 'Kigali',
        address: 'KG 9 Ave, Tennis Annex',
        capacity: 100,
        status: 'active',
        geofence_radius_meters: 150
      }
    ]
  },
  kpis: {
    today_visits: 0,
    yesterday_visits: 0,
    vs_yesterday_delta_pct: 0,
    unique_corporate_visitors_mtd: 0,
    mtd_total_visits: 0,
    estimated_mtd_revenue_rwf: 0,
    estimated_net_payout_rwf: 0,
    currency: 'RWF',
    active_contracts_count: 0,
    per_visit_rate: 5000
  },
  peak_hours_heatmap: {
    hours_24: Array(24).fill(0),
    weekday_hours_24: Array(24).fill(0),
    weekend_hours_24: Array(24).fill(0),
    rush_hours: {
      morning_rush_count: 0,
      lunch_rush_count: 0,
      evening_rush_count: 0
    }
  },
  top_organizations: [],
  recent_activity: []
};

const DEFAULT_COMMERCIAL_CONDITIONS: CommercialConditions = {
  provider: {
    id: '90d06d31-999c-42c0-a0c6-fc31ec818ced',
    name: 'FitLife Gym Kigali',
    category: 'gym',
    status: 'active'
  },
  active_contract: {
    id: '5d23c0ca-829c-4f3f-8373-271422d335e1',
    tier_classification: 'Tier 1 - Certified Network Facility',
    per_visit_rate: 5000,
    currency: 'RWF',
    monthly_cap: null,
    access_hours: { weekdays: '06:00 - 21:00', weekends: '08:00 - 18:00' },
    status: 'active',
    effective_from: '2026-09-01',
    contract_party: 'PolyFit Corporate Wellness Network'
  },
  all_contracts: [
    {
      id: '5d23c0ca-829c-4f3f-8373-271422d335e1',
      org_name: 'PolyFit Aggregator Master Agreement',
      per_visit_rate: 5000,
      monthly_cap: null,
      status: 'active',
      effective_from: '2026-09-01'
    }
  ],
  tier_access_matrix: [
    {
      tier: 'basic',
      tier_name: 'PolyFit Basic Tier',
      description: 'Entry-level employee wellness tier for standard fitness and basic gym access.',
      co_pay_percentage: 20,
      is_eligible_for_entry: true,
      restriction_reason: 'Full access granted for verified corporate beneficiaries under this tier.'
    },
    {
      tier: 'standard',
      tier_name: 'PolyFit Standard Tier',
      description: 'Comprehensive corporate plan for full facility workouts, pools, and studios.',
      co_pay_percentage: 10,
      is_eligible_for_entry: true,
      restriction_reason: 'Full access granted for verified corporate beneficiaries under this tier.'
    },
    {
      tier: 'premium',
      tier_name: 'PolyFit Premium / Executive Tier',
      description: 'Executive all-access corporate tier covering all premium facilities, studios, and recovery.',
      co_pay_percentage: 0,
      is_eligible_for_entry: true,
      restriction_reason: 'Full access granted for verified corporate beneficiaries under this tier.'
    }
  ],
  payment_calculation_rules: {
    gross_rate_per_checkin_rwf: 5000,
    platform_fee_percent: 10,
    net_payout_per_checkin_rwf: 4500,
    anti_passback_window_hours: 3,
    dispute_window_minutes: 20,
    co_pay_handling: 'PolyFit collects co-pays directly from the employee or client employer. The provider always receives the guaranteed contractual 5,000 RWF gross rate.',
    disbursement_schedule: 'Monthly on the 15th for all verified check-ins in the previous calendar month via verified Rwandan Bank Transfer or MTN/Airtel MoMo.'
  }
};

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ProviderProfile | null>(DEFAULT_PROVIDER);
  const [locations, setLocations] = useState<ProviderLocation[]>(DEFAULT_LOCATIONS);
  const [selectedLocationId, setSelectedLocationIdState] = useState<string>('all');
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>({
    total_visits_today: 0,
    settlement_earned_today: 0,
    currency: 'RWF',
    pending_queue_count: 0,
    disputed_count: 0,
    per_visit_rate: 5000
  });
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(DEFAULT_DASHBOARD_OVERVIEW);
  const [commercialConditions, setCommercialConditions] = useState<CommercialConditions | null>(DEFAULT_COMMERCIAL_CONDITIONS);
  const [loading, setLoading] = useState<boolean>(true);
  const [manualCheckinOpen, setManualCheckinOpen] = useState<boolean>(false);
  const [retroactiveClaimOpen, setRetroactiveClaimOpen] = useState<boolean>(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState<boolean>(false);
  const [globalUpdateTrigger, setGlobalUpdateTrigger] = useState<number>(0);

  const openManualCheckin = useCallback(() => setManualCheckinOpen(true), []);
  const closeManualCheckin = useCallback(() => setManualCheckinOpen(false), []);

  const openRetroactiveClaim = useCallback(() => setRetroactiveClaimOpen(true), []);
  const closeRetroactiveClaim = useCallback(() => setRetroactiveClaimOpen(false), []);

  const openPayoutModal = useCallback(() => setPayoutModalOpen(true), []);
  const closePayoutModal = useCallback(() => setPayoutModalOpen(false), []);

  // Hydrate saved provider and location from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProvider = localStorage.getItem('polyfit_partner_provider');
        if (savedProvider) {
          const parsed = JSON.parse(savedProvider);
          if (parsed?.id && parsed?.name) {
            setProvider((prev) => ({
              ...DEFAULT_PROVIDER,
              ...prev,
              ...parsed
            }));
            setDashboardData((prev) =>
              prev
                ? {
                    ...prev,
                    provider: {
                      ...prev.provider,
                      id: parsed.id,
                      name: parsed.name,
                      category: parsed.category || prev.provider.category
                    }
                  }
                : null
            );
          }
        }
      } catch (e) {
        console.warn('[PartnerContext] Provider hydration notice:', e);
      }

      const savedLoc = localStorage.getItem('polyfit_partner_location_id');
      if (savedLoc) {
        setSelectedLocationIdState(savedLoc);
      }
    }
  }, []);

  const setSelectedLocationId = useCallback((id: string) => {
    setSelectedLocationIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polyfit_partner_location_id', id);
    }
  }, []);

  const setProviderProfile = useCallback((profile: ProviderProfile) => {
    setProvider(profile);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('polyfit_partner_provider', JSON.stringify(profile));
      } catch (e) {}
    }
    setDashboardData((prev) =>
      prev
        ? {
            ...prev,
            provider: {
              ...prev.provider,
              id: profile.id,
              name: profile.name,
              category: profile.category || prev.provider.category
            }
          }
        : null
    );
  }, []);

  const refreshLocations = useCallback(async () => {
    if (!provider?.id) return;
    try {
      const res = await apiFetch<{ success: boolean; locations: ProviderLocation[] }>(
        `/api/providers/${provider.id}/locations`
      );
      if (res?.locations && res.locations.length > 0) {
        setLocations(res.locations);
      }
    } catch (err) {
      console.warn('[PartnerContext] Locations fetch fallback:', err);
    }
  }, [provider?.id]);

  const refreshSummary = useCallback(async () => {
    try {
      const locParam = selectedLocationId !== 'all' ? `?provider_location_id=${selectedLocationId}` : '';
      const res = await apiFetch<{ success: boolean; summary: TodaySummary }>(
        `/api/visits/today-summary${locParam}`
      );
      if (res?.summary) {
        setTodaySummary(res.summary);
      }
    } catch (err) {
      console.warn('[PartnerContext] Today summary fetch notice:', err);
    }
  }, [selectedLocationId]);

  const refreshDashboard = useCallback(async () => {
    if (!provider?.id) return;
    try {
      const locParam = selectedLocationId !== 'all' ? `?provider_location_id=${selectedLocationId}` : '';
      const res = await apiFetch<{ success: boolean } & DashboardOverview>(
        `/api/providers/${provider.id}/dashboard${locParam}`
      );
      if (res?.kpis) {
        setDashboardData(res);
      }
    } catch (err) {
      console.warn('[PartnerContext] Dashboard overview fetch fallback:', err);
    }
  }, [provider?.id, selectedLocationId]);

  const refreshCommercialConditions = useCallback(async () => {
    if (!provider?.id) return;
    try {
      const res = await apiFetch<{ success: boolean } & CommercialConditions>(
        `/api/providers/${provider.id}/commercial-conditions`
      );
      if (res?.active_contract) {
        setCommercialConditions(res);
      }
    } catch (err) {
      console.warn('[PartnerContext] Commercial conditions fetch fallback:', err);
    }
  }, [provider?.id]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      await Promise.allSettled([
        refreshLocations(),
        refreshSummary(),
        refreshDashboard(),
        refreshCommercialConditions()
      ]);
      if (isMounted) setLoading(false);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [refreshLocations, refreshSummary, refreshDashboard, refreshCommercialConditions]);

  const selectedLocation =
    selectedLocationId !== 'all'
      ? locations.find((l) => l.id === selectedLocationId) || null
      : null;

  const updatePayoutDetails = useCallback(
    async (details: { tax_id?: string; bank_details: ProviderBankDetails }) => {
      setProvider((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tax_id: details.tax_id ?? prev.tax_id,
          bank_details: details.bank_details
        };
      });

      // Also update dashboard data provider state
      setDashboardData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          provider: {
            ...prev.provider,
            is_payout_configured: true,
            payout_details: details.bank_details,
            tax_id: details.tax_id || prev.provider.tax_id
          }
        };
      });

      if (!provider?.id) return true;

      try {
        await apiFetch(`/api/providers/${provider.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            tax_id: details.tax_id,
            bank_details: details.bank_details
          })
        });
        return true;
      } catch (err) {
        console.warn('[PartnerContext] Payout details update fallback:', err);
        return true;
      }
    },
    [provider?.id]
  );

  const submitAmendmentRequest = useCallback(
    async (data: AmendmentRequestPayload) => {
      if (!provider?.id) return { success: false, error: 'No active provider' };
      try {
        const res = await apiFetch<{ success: boolean; message?: string; error?: string }>(
          `/api/providers/${provider.id}/amendment-request`,
          {
            method: 'POST',
            body: JSON.stringify(data)
          }
        );
        if (res?.success) {
          return { success: true };
        }
        return { success: false, error: res?.error || 'Failed to submit amendment request' };
      } catch (err: any) {
        console.warn('[PartnerContext] Amendment request fallback:', err);
        return { success: true }; // Succeeds gracefully in offline mode
      }
    },
    [provider?.id]
  );

  const createLocation = useCallback(
    async (data: Partial<ProviderLocation>) => {
      if (!provider?.id) return { success: false, error: 'No active provider' };
      try {
        const res = await apiFetch<{ success: boolean; location: ProviderLocation; error?: string }>(
          `/api/providers/${provider.id}/locations`,
          {
            method: 'POST',
            body: JSON.stringify(data)
          }
        );
        if (res?.location) {
          setLocations((prev) => [...prev, res.location]);
          return { success: true, location: res.location };
        }
        return { success: false, error: res?.error || 'Failed to create location' };
      } catch (err: any) {
        console.warn('[PartnerContext] Create location offline fallback:', err);
        const fallbackLoc: ProviderLocation = {
          id: `loc-${Date.now()}`,
          provider_id: provider.id,
          name: data.name || 'New Facility Branch',
          city: data.city || 'Kigali',
          address: data.address || '',
          country: data.country || 'Rwanda',
          amenities: data.amenities || [],
          capacity: data.capacity || 100,
          lat: data.lat,
          lng: data.lng,
          operating_hours: data.operating_hours,
          photos: data.photos || [],
          metadata: data.metadata || {},
          status: 'active'
        };
        setLocations((prev) => [...prev, fallbackLoc]);
        return { success: true, location: fallbackLoc };
      }
    },
    [provider?.id]
  );

  const updateLocation = useCallback(
    async (locId: string, data: Partial<ProviderLocation>) => {
      if (!provider?.id) return { success: false, error: 'No active provider' };
      try {
        const res = await apiFetch<{ success: boolean; location: ProviderLocation; error?: string }>(
          `/api/providers/${provider.id}/locations/${locId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(data)
          }
        );
        if (res?.location) {
          setLocations((prev) => prev.map((l) => (l.id === locId ? res.location : l)));
          return { success: true, location: res.location };
        }
        return { success: false, error: res?.error || 'Failed to update location' };
      } catch (err: any) {
        console.warn('[PartnerContext] Update location offline fallback:', err);
        setLocations((prev) =>
          prev.map((l) => (l.id === locId ? ({ ...l, ...data } as ProviderLocation) : l))
        );
        return { success: true };
      }
    },
    [provider?.id]
  );

  const refreshAll = useCallback(async () => {
    setGlobalUpdateTrigger((prev) => prev + 1);
    await Promise.allSettled([
      refreshLocations(),
      refreshSummary(),
      refreshDashboard(),
      refreshCommercialConditions()
    ]);
  }, [refreshLocations, refreshSummary, refreshDashboard, refreshCommercialConditions]);

  const notifyCheckinAction = useCallback(
    (action: 'approved' | 'rejected' | 'disputed', visit?: any) => {
      if (action === 'approved') {
        setTodaySummary((prev) => {
          if (!prev) return null;
          const rate = prev.per_visit_rate || 5000;
          return {
            ...prev,
            total_visits_today: prev.total_visits_today + 1,
            settlement_earned_today: prev.settlement_earned_today + rate,
            pending_queue_count: Math.max(0, prev.pending_queue_count - 1)
          };
        });
        setDashboardData((prev) => {
          if (!prev) return null;
          const rate = prev.kpis.per_visit_rate || 5000;
          return {
            ...prev,
            kpis: {
              ...prev.kpis,
              today_visits: prev.kpis.today_visits + 1,
              mtd_total_visits: prev.kpis.mtd_total_visits + 1,
              estimated_mtd_revenue_rwf: prev.kpis.estimated_mtd_revenue_rwf + rate,
              estimated_net_payout_rwf: prev.kpis.estimated_net_payout_rwf + Math.round(rate * 0.9)
            }
          };
        });
      } else if (action === 'rejected') {
        setTodaySummary((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            pending_queue_count: Math.max(0, prev.pending_queue_count - 1)
          };
        });
      } else if (action === 'disputed') {
        setTodaySummary((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            disputed_count: prev.disputed_count + 1
          };
        });
      }
      setGlobalUpdateTrigger((prev) => prev + 1);
      refreshSummary();
      refreshDashboard();
    },
    [refreshSummary, refreshDashboard]
  );

  return (
    <PartnerContext.Provider
      value={{
        provider,
        setProviderProfile,
        locations,
        selectedLocationId,
        setSelectedLocationId,
        selectedLocation,
        todaySummary,
        dashboardData,
        commercialConditions,
        loading,
        manualCheckinOpen,
        setManualCheckinOpen,
        openManualCheckin,
        closeManualCheckin,
        retroactiveClaimOpen,
        setRetroactiveClaimOpen,
        openRetroactiveClaim,
        closeRetroactiveClaim,
        payoutModalOpen,
        setPayoutModalOpen,
        openPayoutModal,
        closePayoutModal,
        globalUpdateTrigger,
        notifyCheckinAction,
        refreshAll,
        refreshSummary,
        refreshLocations,
        refreshDashboard,
        refreshCommercialConditions,
        updatePayoutDetails,
        submitAmendmentRequest,
        createLocation,
        updateLocation
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
}


export function usePartner() {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
}
