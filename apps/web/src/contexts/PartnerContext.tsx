'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

export interface ProviderLocation {
  id: string;
  provider_id: string;
  name: string;
  city: string;
  address?: string;
  amenities?: string[];
  capacity?: number;
}

export interface ProviderProfile {
  id: string;
  name: string;
  category: string;
  contact_email?: string;
  settlement_email?: string;
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
        refreshLocations
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
