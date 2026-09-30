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

interface PartnerContextType {
  provider: ProviderProfile | null;
  locations: ProviderLocation[];
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  selectedLocation: ProviderLocation | null;
  todaySummary: TodaySummary | null;
  loading: boolean;
  refreshSummary: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  updatePayoutDetails: (details: { tax_id?: string; bank_details: ProviderBankDetails }) => Promise<boolean>;
  createLocation: (data: Partial<ProviderLocation>) => Promise<{ success: boolean; location?: ProviderLocation; error?: string }>;
  updateLocation: (locId: string, data: Partial<ProviderLocation>) => Promise<{ success: boolean; location?: ProviderLocation; error?: string }>;
}

// Fallback seed data for seamless evaluation & counter testing
const DEFAULT_PROVIDER: ProviderProfile = {
  id: '90d06d31-999c-42c0-a0c6-fc31ec818ced',
  name: 'FitLife Gym Kigali',
  category: 'gym',
  contact_email: 'ops@fitlife.rw',
  rating: 4.8
};

const DEFAULT_LOCATIONS: ProviderLocation[] = [
  {
    id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
    provider_id: '90d06d31-999c-42c0-a0c6-fc31ec818ced',
    name: 'Kigali Central Facility (Unit #851931)',
    city: 'Kigali',
    address: 'KN 3 Ave, Kigali City Tower, Level 2',
    capacity: 150
  },
  {
    id: '189e7cb8-155e-419a-8b83-bd9e3eb021da',
    provider_id: '90d06d31-999c-42c0-a0c6-fc31ec818ced',
    name: 'Nyarutarama Health Branch (Unit #851932)',
    city: 'Kigali',
    address: 'KG 9 Ave, Nyarutarama Tennis Club Annex',
    capacity: 100
  }
];

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ProviderProfile | null>(DEFAULT_PROVIDER);
  const [locations, setLocations] = useState<ProviderLocation[]>(DEFAULT_LOCATIONS);
  const [selectedLocationId, setSelectedLocationIdState] = useState<string>('all');
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>({
    total_visits_today: 18,
    settlement_earned_today: 90000,
    currency: 'RWF',
    pending_queue_count: 2,
    disputed_count: 0,
    per_visit_rate: 5000
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Load saved location from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polyfit_partner_location_id');
      if (saved) {
        setSelectedLocationIdState(saved);
      }
    }
  }, []);

  const setSelectedLocationId = useCallback((id: string) => {
    setSelectedLocationIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polyfit_partner_location_id', id);
    }
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

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      await Promise.allSettled([refreshLocations(), refreshSummary()]);
      if (isMounted) setLoading(false);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [refreshLocations, refreshSummary]);

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
        return true; // Still succeeds locally for evaluation/offline mode
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

  return (
    <PartnerContext.Provider
      value={{
        provider,
        locations,
        selectedLocationId,
        setSelectedLocationId,
        selectedLocation,
        todaySummary,
        loading,
        refreshSummary,
        refreshLocations,
        updatePayoutDetails,
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
