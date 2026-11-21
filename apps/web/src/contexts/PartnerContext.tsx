'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

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
  status?: string;
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
  providerStatus: 'active' | 'pending_review' | 'not_found' | 'loading';
  isSuperAdmin: boolean;
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

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const { providerId, user, isSuperAdmin, isDemoMode, isLoading: authLoading } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [providerStatus, setProviderStatus] = useState<'active' | 'pending_review' | 'not_found' | 'loading'>('loading');
  const [locations, setLocations] = useState<ProviderLocation[]>([]);
  const [selectedLocationId, setSelectedLocationIdState] = useState<string>('all');
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [commercialConditions, setCommercialConditions] = useState<CommercialConditions | null>(null);
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

  // Dynamic Partner session resolution & tenant isolation
  useEffect(() => {
    let isCancelled = false;

    async function initPartnerSession() {
      if (authLoading) {
        setProviderStatus('loading');
        return;
      }

      if (!user) {
        setProvider(null);
        setProviderStatus('loading');
        setLoading(false);
        return;
      }

      setProviderStatus('loading');
      setLoading(true);

      try {
        let resolvedProvider: ProviderProfile | null = null;
        let provStatus = 'active';

        // 1. Direct providerId resolution
        const targetProvId = providerId || user?.user_metadata?.provider_id;
        if (targetProvId) {
          try {
            const res = await apiFetch<any>(`/api/providers/${targetProvId}`);
            if (res?.provider) {
              resolvedProvider = res.provider;
              provStatus = res.provider.status || 'active';
            }
          } catch (e) {
            console.warn('[PartnerContext] Error fetching provider by ID:', e);
          }
        }

        // 3. Email lookup resolution
        if (!resolvedProvider && user.email) {
          try {
            const checkRes = await apiFetch<any>(`/api/public/partner/check-email?email=${encodeURIComponent(user.email)}`);
            if (checkRes?.exists && checkRes.provider_id) {
              provStatus = checkRes.status || 'active';
              resolvedProvider = {
                id: checkRes.provider_id,
                name: checkRes.provider_name || 'Wellness Provider Facility',
                category: checkRes.category || 'gym',
                contact_email: user.email,
                status: provStatus
              };
            }
          } catch (e) {
            console.warn('[PartnerContext] Error looking up partner by email:', e);
          }
        }

        if (isCancelled) return;

        if (resolvedProvider) {
          setProvider(resolvedProvider);
          if (provStatus === 'pending_review' || resolvedProvider.status === 'pending_review') {
            setProviderStatus('pending_review');
          } else {
            setProviderStatus('active');
          }
          setDashboardData((prev) =>
            prev
              ? {
                  ...prev,
                  provider: {
                    ...prev.provider,
                    id: resolvedProvider!.id,
                    name: resolvedProvider!.name,
                    category: resolvedProvider!.category || prev.provider.category
                  }
                }
              : null
          );
        } else {
          setProvider(null);
          setProviderStatus('not_found');
        }
      } catch (err) {
        console.error('[PartnerContext] Error initializing partner session:', err);
        if (!isCancelled) {
          setProviderStatus('not_found');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    initPartnerSession();

    return () => {
      isCancelled = true;
    };
  }, [user, providerId, isSuperAdmin, isDemoMode, authLoading]);

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

const hasAuthToken = () => {
  if (typeof window === 'undefined') return false;
  try {
    return !!(
      localStorage.getItem('polyfit_token') ||
      localStorage.getItem('polyfit_partner_token') ||
      localStorage.getItem('sb-meszhexftehllnsyhbha-auth-token') ||
      document.cookie.includes('sb-')
    );
  } catch {
    return false;
  }
};

  const refreshLocations = useCallback(async () => {
    if (!provider?.id || !hasAuthToken()) return;
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
    if (!hasAuthToken()) return;
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
    if (!provider?.id || !hasAuthToken()) return;
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
    if (!provider?.id || !hasAuthToken()) return;
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
      if (!hasAuthToken()) {
        if (isMounted) setLoading(false);
        return;
      }
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

    // Background sync: poll summary every 30s if window is visible and authenticated
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && hasAuthToken()) {
        refreshSummary();
      }
    }, 30000);

    // Refresh on tab focus if authenticated
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && hasAuthToken()) {
        refreshSummary();
        refreshDashboard();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
      }
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
        console.error('[PartnerContext] Amendment request error:', err);
        return { success: false, error: err?.message || 'Failed to submit amendment request' };
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
        console.error('[PartnerContext] Create location error:', err);
        return { success: false, error: err?.message || 'Failed to create location' };
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
        console.error('[PartnerContext] Update location error:', err);
        return { success: false, error: err?.message || 'Failed to update location' };
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
        providerStatus,
        isSuperAdmin,
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
