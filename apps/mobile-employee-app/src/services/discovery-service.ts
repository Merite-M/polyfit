/**
 * PolyFit Corporate Employee App - Provider Discovery Service (PF-100)
 * B2B2C Aggregator Discovery & 100% Offline Resilience
 */

import { Platform } from 'react-native';
import {
  DiscoveredFacility,
  OperatingStatus,
  WeeklyOperatingHours,
  ProviderCategory,
} from '@/types/discovery';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://polyfit-backend.onrender.com'
    : 'http://localhost:3001');

const STORAGE_KEY_FACILITIES_CACHE = 'polyfit_cached_facilities';

// Haversine formula to calculate distance in km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Extract neighborhood from address or name
export function extractNeighborhood(address?: string | null, name?: string | null): string {
  const text = `${address || ''} ${name || ''}`.toLowerCase();
  if (text.includes('kimihurura') || text.includes('kigali heights') || text.includes('kg 7 ave')) return 'Kimihurura';
  if (text.includes('kiyovu') || text.includes('kn 3 ave')) return 'Kiyovu';
  if (text.includes('nyarutarama')) return 'Nyarutarama';
  if (text.includes('gishushu')) return 'Gishushu';
  if (text.includes('remera')) return 'Remera';
  if (text.includes('kacyiru')) return 'Kacyiru';
  if (text.includes('downtown') || text.includes('central') || text.includes('kn 4')) return 'Downtown';
  if (text.includes('kagugu')) return 'Kagugu';
  return 'Kigali Central';
}

// Compute live open/closed status from operating hours
export function getFacilityOperatingStatus(
  hours: WeeklyOperatingHours | null | undefined
): OperatingStatus {
  if (!hours) {
    return {
      isOpen: true,
      statusText: 'Open today • 06:00 - 22:00',
      statusBadge: 'open',
    };
  }

  const days: (keyof WeeklyOperatingHours)[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  const now = new Date();
  const currentDay = days[now.getDay()];
  const todayHours = hours[currentDay];

  if (!todayHours || !todayHours.open || !todayHours.close) {
    // Check if open on other days
    return {
      isOpen: false,
      statusText: 'Closed today',
      statusBadge: 'closed',
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);

  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    const minutesLeft = closeMinutes - currentMinutes;
    if (minutesLeft <= 45) {
      return {
        isOpen: true,
        statusText: `Closing soon • in ${minutesLeft}m`,
        statusBadge: 'closing_soon',
      };
    }

    // Format close time nicely (e.g. 22:00 -> 10:00 PM)
    const formattedClose =
      closeH > 12 ? `${closeH - 12}:${closeM === 0 ? '00' : closeM} PM` : `${closeH}:${closeM === 0 ? '00' : closeM} AM`;

    return {
      isOpen: true,
      statusText: `Open Now • Closes ${formattedClose}`,
      statusBadge: 'open',
    };
  }

  if (currentMinutes < openMinutes) {
    const formattedOpen =
      openH > 12 ? `${openH - 12}:${openM === 0 ? '00' : openM} PM` : `${openH}:${openM === 0 ? '00' : openM} AM`;
    return {
      isOpen: false,
      statusText: `Closed • Opens at ${formattedOpen}`,
      statusBadge: 'closed',
    };
  }

  // After closing, find next day's open
  const nextDay = days[(now.getDay() + 1) % 7];
  const nextHours = hours[nextDay];
  if (nextHours && nextHours.open) {
    const [nextH, nextM] = nextHours.open.split(':').map(Number);
    const formattedNext =
      nextH > 12 ? `${nextH - 12}:${nextM === 0 ? '00' : nextM} PM` : `${nextH}:${nextM === 0 ? '00' : nextM} AM`;
    return {
      isOpen: false,
      statusText: `Closed • Opens tomorrow ${formattedNext}`,
      statusBadge: 'closed',
    };
  }

  return {
    isOpen: false,
    statusText: 'Closed for the day',
    statusBadge: 'closed',
  };
}

// Curated high-fidelity flagship Kigali wellness network facilities
export const CURATED_KIGALI_FACILITIES: DiscoveredFacility[] = [
  {
    location_id: 'loc-kh-kimihurura',
    location_name: 'Kigali Heights Fitness Club',
    address: 'KG 7 Ave, Kigali Heights 4th Floor',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Kimihurura',
    lat: -1.9536,
    lng: 30.0924,
    distance_meters: 620,
    distance_km: 0.62,
    operating_hours: {
      monday: { open: '05:30', close: '22:00' },
      tuesday: { open: '05:30', close: '22:00' },
      wednesday: { open: '05:30', close: '22:00' },
      thursday: { open: '05:30', close: '22:00' },
      friday: { open: '05:30', close: '22:00' },
      saturday: { open: '06:00', close: '21:00' },
      sunday: { open: '07:00', close: '20:00' },
    },
    amenities: ['shower', 'locker', 'sauna', 'parking', 'cafe', 'towel'],
    photos: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 120,
    provider: {
      id: 'prov-kigali-heights',
      name: 'Kigali Heights Fitness',
      category: 'gym',
      rating: 4.9,
      contact_email: 'wellness@kigaliheights.rw',
    },
  },
  {
    location_id: 'loc-cercle-sportif-kiyovu',
    location_name: 'Cercle Sportif Olympic Pool & Pavilion',
    address: 'KN 3 Ave, Kiyovu',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Kiyovu',
    lat: -1.9612,
    lng: 30.0658,
    distance_meters: 1150,
    distance_km: 1.15,
    operating_hours: {
      monday: { open: '06:00', close: '20:30' },
      tuesday: { open: '06:00', close: '20:30' },
      wednesday: { open: '06:00', close: '20:30' },
      thursday: { open: '06:00', close: '20:30' },
      friday: { open: '06:00', close: '20:30' },
      saturday: { open: '06:30', close: '21:00' },
      sunday: { open: '07:00', close: '20:00' },
    },
    amenities: ['pool', 'shower', 'locker', 'parking', 'tennis', 'coaching'],
    photos: [
      'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 80,
    provider: {
      id: 'prov-cercle-sportif',
      name: 'Cercle Sportif de Kigali',
      category: 'pool',
      rating: 4.8,
      contact_email: 'info@cerclesportif.rw',
    },
  },
  {
    location_id: 'loc-zen-nyarutarama',
    location_name: 'Zen Wellness & Reformer Pilates',
    address: 'KG 9 Ave, Nyarutarama Green Belt',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Nyarutarama',
    lat: -1.9385,
    lng: 30.1012,
    distance_meters: 2400,
    distance_km: 2.4,
    operating_hours: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '21:00' },
      saturday: { open: '08:00', close: '19:00' },
      sunday: { open: '08:30', close: '18:00' },
    },
    amenities: ['reformer', 'shower', 'locker', 'towel', 'sound_bath', 'tea_bar'],
    photos: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 45,
    provider: {
      id: 'prov-zen-wellness',
      name: 'Zen Wellness Collective',
      category: 'studio',
      rating: 5.0,
      contact_email: 'hello@zenkigali.rw',
    },
  },
  {
    location_id: 'loc-serena-spa-kiyovu',
    location_name: 'Serena Maisha Health Club & Hydrotherapy',
    address: 'KN 3 Ave, Kigali Serena Hotel',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Kiyovu',
    lat: -1.9542,
    lng: 30.0615,
    distance_meters: 1850,
    distance_km: 1.85,
    operating_hours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '06:00', close: '22:00' },
      sunday: { open: '07:00', close: '21:00' },
    },
    amenities: ['sauna', 'steam_room', 'pool', 'shower', 'parking', 'towel', 'lockers'],
    photos: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 65,
    provider: {
      id: 'prov-serena-maisha',
      name: 'Serena Maisha Wellness',
      category: 'wellness_center',
      rating: 4.9,
      contact_email: 'maisha@serenakigali.rw',
    },
  },
  {
    location_id: 'loc-waka-downtown',
    location_name: 'Waka Fitness & Performance Center',
    address: 'KN 67 St, Commercial District',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Downtown',
    lat: -1.9482,
    lng: 30.0592,
    distance_meters: 1600,
    distance_km: 1.6,
    operating_hours: {
      monday: { open: '05:30', close: '22:00' },
      tuesday: { open: '05:30', close: '22:00' },
      wednesday: { open: '05:30', close: '22:00' },
      thursday: { open: '05:30', close: '22:00' },
      friday: { open: '05:30', close: '22:00' },
      saturday: { open: '07:00', close: '20:00' },
      sunday: { open: '08:00', close: '18:00' },
    },
    amenities: ['shower', 'locker', 'parking', 'crossfit', 'smoothie_bar'],
    photos: [
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 100,
    provider: {
      id: 'prov-waka-fitness',
      name: 'Waka Fitness Life',
      category: 'gym',
      rating: 4.7,
      contact_email: 'team@wakafitness.rw',
    },
  },
  {
    location_id: 'loc-soho-gishushu',
    location_name: 'Soho Fitness & Conditioning Club',
    address: 'KG 9 Ave, Gishushu Boulevard',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Gishushu',
    lat: -1.9536,
    lng: 30.0924,
    distance_meters: 850,
    distance_km: 0.85,
    operating_hours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '07:00', close: '21:00' },
      sunday: { open: '08:00', close: '20:00' },
    },
    amenities: ['shower', 'locker', 'sauna', 'parking', 'boxing'],
    photos: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 90,
    provider: {
      id: 'prov-soho-fitness',
      name: 'Soho Fitness Club',
      category: 'gym',
      rating: 4.8,
      contact_email: 'contact@sohofitness.rw',
    },
  },
  {
    location_id: 'loc-inzozi-kacyiru',
    location_name: 'Inzozi Yoga & Breathwork Sanctuary',
    address: 'KG 543 St, Kacyiru Hill',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Kacyiru',
    lat: -1.9392,
    lng: 30.0825,
    distance_meters: 1950,
    distance_km: 1.95,
    operating_hours: {
      monday: { open: '06:30', close: '20:30' },
      tuesday: { open: '06:30', close: '20:30' },
      wednesday: { open: '06:30', close: '20:30' },
      thursday: { open: '06:30', close: '20:30' },
      friday: { open: '06:30', close: '20:30' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '08:30', close: '17:00' },
    },
    amenities: ['shower', 'towel', 'mats', 'garden_view', 'herbal_tea'],
    photos: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 40,
    provider: {
      id: 'prov-inzozi-yoga',
      name: 'Inzozi Wellness Rwanda',
      category: 'studio',
      rating: 4.9,
      contact_email: 'namaste@inzoziyoga.rw',
    },
  },
  {
    location_id: 'loc-remera-pool',
    location_name: 'Remera Aquatic & Padel Sports Club',
    address: 'KG 11 Ave, Near Amahoro Stadium',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Remera',
    lat: -1.9585,
    lng: 30.1142,
    distance_meters: 3200,
    distance_km: 3.2,
    operating_hours: {
      monday: { open: '06:00', close: '21:00' },
      tuesday: { open: '06:00', close: '21:00' },
      wednesday: { open: '06:00', close: '21:00' },
      thursday: { open: '06:00', close: '21:00' },
      friday: { open: '06:00', close: '21:00' },
      saturday: { open: '06:30', close: '21:30' },
      sunday: { open: '07:00', close: '20:00' },
    },
    amenities: ['pool', 'shower', 'locker', 'parking', 'padel_courts'],
    photos: [
      'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 110,
    provider: {
      id: 'prov-remera-sports',
      name: 'Remera Sports Hub',
      category: 'sports',
      rating: 4.7,
      contact_email: 'remera@polyfit-partners.rw',
    },
  },
];

export class DiscoveryService {
  /**
   * Save facilities to offline storage cache
   */
  private static async cacheFacilitiesLocally(facilities: DiscoveredFacility[]): Promise<void> {
    try {
      const serialized = JSON.stringify(facilities);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY_FACILITIES_CACHE, serialized);
        }
      } else {
        const SecureStore = require('expo-secure-store');
        await SecureStore.setItemAsync(STORAGE_KEY_FACILITIES_CACHE, serialized);
      }
    } catch (e) {
      console.warn('[DiscoveryService] Cache note:', e);
    }
  }

  /**
   * Retrieve cached facilities
   */
  public static async getCachedFacilities(): Promise<DiscoveredFacility[]> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          raw = window.localStorage.getItem(STORAGE_KEY_FACILITIES_CACHE);
        }
      } else {
        const SecureStore = require('expo-secure-store');
        raw = await SecureStore.getItemAsync(STORAGE_KEY_FACILITIES_CACHE);
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[DiscoveryService] Cache read note:', e);
    }
    return CURATED_KIGALI_FACILITIES;
  }

  /**
   * Primary Discovery Query
   * Live backend query with automatic fallback to curated/cached directory
   */
  public static async fetchFacilities(params: {
    lat?: number | null;
    lng?: number | null;
    category?: ProviderCategory | 'all';
    search?: string;
    amenities?: string[];
    allowedCategories?: string[];
  }): Promise<{ facilities: DiscoveredFacility[]; isOffline: boolean }> {
    const { lat, lng, category, search, amenities, allowedCategories } = params;

    const queryParams = new URLSearchParams();
    if (lat) queryParams.set('lat', String(lat));
    if (lng) queryParams.set('lng', String(lng));
    if (category && category !== 'all') queryParams.set('category', category);
    if (search && search.trim()) queryParams.set('search', search.trim());
    if (amenities && amenities.length > 0) queryParams.set('amenities', amenities.join(','));
    queryParams.set('limit', '50');

    try {
      const res = await fetch(`${API_BASE_URL}/api/providers/discover?${queryParams.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        const rawResults: any[] = json.results || [];

        // Enrich results with neighborhood and photos if needed
        const enriched: DiscoveredFacility[] = rawResults.map((item, index) => {
          const fallbackCurated = CURATED_KIGALI_FACILITIES[index % CURATED_KIGALI_FACILITIES.length];
          const itemPhotos = item.photos && item.photos.length > 0 ? item.photos : fallbackCurated.photos;
          const neighborhood = extractNeighborhood(item.address, item.location_name);

          // Calculate distance if missing
          let distKm = item.distance_km;
          if (distKm === null && lat && lng && item.lat && item.lng) {
            distKm = calculateDistanceKm(lat, lng, Number(item.lat), Number(item.lng));
          }

          const cat = (item.provider?.category || 'gym') as ProviderCategory;
          const isIncluded = allowedCategories
            ? allowedCategories.includes(cat) || allowedCategories.includes('wellness_center')
            : true;

          return {
            location_id: item.location_id || `loc-${index}`,
            location_name: item.location_name || item.provider?.name || 'PolyFit Partner Facility',
            address: item.address || 'Kigali, Rwanda',
            city: item.city || 'Kigali',
            country: item.country || 'Rwanda',
            neighborhood,
            lat: item.lat ? Number(item.lat) : fallbackCurated.lat,
            lng: item.lng ? Number(item.lng) : fallbackCurated.lng,
            distance_meters: item.distance_meters,
            distance_km: distKm,
            operating_hours: item.operating_hours || fallbackCurated.operating_hours,
            amenities: item.amenities && item.amenities.length > 0 ? item.amenities : fallbackCurated.amenities,
            photos: itemPhotos,
            capacity: item.capacity || fallbackCurated.capacity,
            provider: {
              id: item.provider?.id || fallbackCurated.provider.id,
              name: item.provider?.name || item.location_name,
              category: cat,
              rating: item.provider?.rating ? Number(item.provider.rating) : 4.8,
              contact_email: item.provider?.contact_email,
            },
            isIncludedInPlan: isIncluded,
          };
        });

        // Cache successful response in local storage
        await this.cacheFacilitiesLocally(enriched);

        return { facilities: enriched, isOffline: false };
      }
    } catch (err) {
      console.warn('[DiscoveryService] Live query offline fallback:', err);
    }

    // Offline / Network Fallback: Use Cached or Curated Seed
    const cached = await this.getCachedFacilities();

    // Re-filter cached facilities locally
    let filtered = [...cached];

    if (category && category !== 'all') {
      filtered = filtered.filter((f) => f.provider.category === category);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (f) =>
          f.location_name.toLowerCase().includes(q) ||
          f.neighborhood.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q) ||
          f.provider.name.toLowerCase().includes(q)
      );
    }

    if (amenities && amenities.length > 0) {
      filtered = filtered.filter((f) =>
        amenities.every((a) => f.amenities.map((x) => x.toLowerCase()).includes(a.toLowerCase()))
      );
    }

    // Recompute distance if user coordinates provided
    if (lat && lng) {
      filtered = filtered.map((f) => {
        if (f.lat && f.lng) {
          const d = calculateDistanceKm(lat, lng, f.lat, f.lng);
          return { ...f, distance_km: d, distance_meters: Math.round(d * 1000) };
        }
        return f;
      });
      filtered.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    }

    // Mark plan inclusion
    filtered = filtered.map((f) => ({
      ...f,
      isIncludedInPlan: allowedCategories
        ? allowedCategories.includes(f.provider.category) || allowedCategories.includes('wellness_center')
        : true,
    }));

    return { facilities: filtered, isOffline: true };
  }
}
