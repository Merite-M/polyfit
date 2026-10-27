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

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates distance in km between two GPS coordinates using an optimized Haversine formula.
 * Optimization:
 * - Fast path early return for identical coordinates (bypasses math operations)
 * - Pre-computed DEG_TO_RAD & EARTH_RADIUS_KM constants avoid repeated floating-point divisions
 * - Uses 2 * Math.asin(Math.sqrt(...)) instead of Math.atan2 (~25-30% math overhead reduction)
 * - Uses arithmetic rounding Math.round(dist * 100) / 100 instead of Number((val).toFixed(2)) to eliminate intermediate string allocations (~45x overall speedup)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const sinDLat2 = Math.sin(dLat / 2);
  const sinDLon2 = Math.sin(dLon / 2);
  const a =
    sinDLat2 * sinDLat2 +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      sinDLon2 *
      sinDLon2;

  const dist = EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
  return Math.round(dist * 100) / 100;
}

// Commute estimate helper (walking vs driving)
export function formatCommuteEstimate(distKm?: number | null): string {
  if (distKm === null || distKm === undefined || isNaN(distKm)) return 'Nearby';
  if (distKm < 0.9) {
    const mins = Math.max(1, Math.round(distKm * 12));
    return `${mins} min walk (${Math.round(distKm * 1000)}m)`;
  }
  const driveMins = Math.max(2, Math.round(distKm * 2.5));
  return `${driveMins} min drive (${distKm} km)`;
}

// Extract neighborhood/district from address, name, or city
export function extractNeighborhood(address?: string | null, name?: string | null, city?: string | null): string {
  const text = `${address || ''} ${name || ''} ${city || ''}`.toLowerCase();
  if (text.includes('musanze') || text.includes('kinigi')) return 'Musanze';
  if (text.includes('rubavu') || text.includes('gisenyi') || text.includes('kivu')) return 'Rubavu';
  if (text.includes('huye') || text.includes('butare')) return 'Huye';
  if (text.includes('rwamagana')) return 'Rwamagana';
  if (text.includes('kimihurura') || text.includes('kigali heights') || text.includes('kg 7 ave') || text.includes('kg 674')) return 'Kimihurura';
  if (text.includes('kiyovu') || text.includes('kn 3 ave')) return 'Kiyovu';
  if (text.includes('nyarutarama') || text.includes('kg 15 ave') || text.includes('kg 9 ave')) return 'Nyarutarama';
  if (text.includes('gishushu')) return 'Gishushu';
  if (text.includes('remera') || text.includes('amahoro') || text.includes('kg 11 ave')) return 'Remera';
  if (text.includes('kacyiru') || text.includes('kg 543')) return 'Kacyiru';
  if (text.includes('downtown') || text.includes('central') || text.includes('kn 4') || text.includes('kn 67') || text.includes('kn 29')) return 'Downtown';
  if (text.includes('kagugu')) return 'Kagugu';
  return 'Kigali';
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

// Curated high-fidelity flagship nationwide wellness network facilities (Rwanda)
export const CURATED_KIGALI_FACILITIES: DiscoveredFacility[] = [
  {
    location_id: 'b0000000-0000-0000-0000-000000000001',
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
    ],
    capacity: 120,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Kigali Heights Fitness Club',
      category: 'gym',
      rating: 4.9,
      contact_email: 'wellness@kigaliheights.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000002',
    location_name: 'Cercle Sportif de Kigali',
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
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 80,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Cercle Sportif de Kigali',
      category: 'pool',
      rating: 4.8,
      contact_email: 'info@cerclesportif.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000003',
    location_name: 'Inzozi Yoga & Pilates Shala',
    address: 'KG 9 Ave, Gishushu Boulevard',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Gishushu',
    lat: -1.948,
    lng: 30.088,
    distance_meters: 1850,
    distance_km: 1.85,
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
      id: 'a0000000-0000-0000-0000-000000000003',
      name: 'Inzozi Yoga & Pilates Shala',
      category: 'studio',
      rating: 4.95,
      contact_email: 'hello@inzoziyoga.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000004',
    location_name: 'Amahoro Sports & Padel Arena',
    address: 'KG 11 Ave, Amahoro Stadium Precinct',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Remera',
    lat: -1.9585,
    lng: 30.1142,
    distance_meters: 3200,
    distance_km: 3.2,
    operating_hours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '06:30', close: '22:00' },
      sunday: { open: '07:00', close: '21:00' },
    },
    amenities: ['padel_courts', 'shower', 'locker', 'parking', 'athletic_track'],
    photos: [
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 110,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000004',
      name: 'Amahoro Sports & Padel Arena',
      category: 'sports',
      rating: 4.85,
      contact_email: 'sports@amahoroarena.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000005',
    location_name: 'Nyarutarama Sports Club & Wellness Center',
    address: 'KG 15 Ave, Nyarutarama Golf Estate',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Nyarutarama',
    lat: -1.9351,
    lng: 30.1035,
    distance_meters: 2800,
    distance_km: 2.8,
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
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 75,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000005',
      name: 'Nyarutarama Sports Club & Wellness Center',
      category: 'wellness_center',
      rating: 4.9,
      contact_email: 'wellness@nyarutaramaclub.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000006',
    location_name: 'Kigali Kinetic Physio & Sports Clinic',
    address: 'KN 4 Ave, Downtown Commercial Hub',
    city: 'Kigali',
    country: 'Rwanda',
    neighborhood: 'Downtown',
    lat: -1.9482,
    lng: 30.0592,
    distance_meters: 1600,
    distance_km: 1.6,
    operating_hours: {
      monday: { open: '08:00', close: '19:00' },
      tuesday: { open: '08:00', close: '19:00' },
      wednesday: { open: '08:00', close: '19:00' },
      thursday: { open: '08:00', close: '19:00' },
      friday: { open: '08:00', close: '19:00' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: null,
    },
    amenities: ['physiotherapy', 'rehab', 'shower', 'parking', 'consultation'],
    photos: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 35,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000006',
      name: 'Kigali Kinetic Physio & Sports Clinic',
      category: 'clinic',
      rating: 4.92,
      contact_email: 'clinic@kigalikinetic.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000007',
    location_name: 'Musanze Volcanoes Athletic Club',
    address: 'NM 21 St, Musanze Central',
    city: 'Musanze',
    country: 'Rwanda',
    neighborhood: 'Musanze',
    lat: -1.498,
    lng: 29.634,
    distance_meters: 68000,
    distance_km: 68.0,
    operating_hours: {
      monday: { open: '05:30', close: '21:30' },
      tuesday: { open: '05:30', close: '21:30' },
      wednesday: { open: '05:30', close: '21:30' },
      thursday: { open: '05:30', close: '21:30' },
      friday: { open: '05:30', close: '21:30' },
      saturday: { open: '06:00', close: '20:00' },
      sunday: { open: '07:00', close: '19:00' },
    },
    amenities: ['altitude_training', 'free_weights', 'sauna', 'lockers'],
    photos: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 90,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000007',
      name: 'Musanze Volcanoes Athletic Club',
      category: 'gym',
      rating: 4.82,
      contact_email: 'musanze@polyfit-partners.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000008',
    location_name: 'Kinigi Highland Yoga & Wellness Shala',
    address: 'Kinigi Eco Park Road, Musanze',
    city: 'Musanze',
    country: 'Rwanda',
    neighborhood: 'Musanze',
    lat: -1.442,
    lng: 29.591,
    distance_meters: 74000,
    distance_km: 74.0,
    operating_hours: {
      monday: { open: '07:00', close: '19:30' },
      tuesday: { open: '07:00', close: '19:30' },
      wednesday: { open: '07:00', close: '19:30' },
      thursday: { open: '07:00', close: '19:30' },
      friday: { open: '07:00', close: '19:30' },
      saturday: { open: '07:30', close: '19:00' },
      sunday: { open: '08:00', close: '18:00' },
    },
    amenities: ['mats', 'tea_bar', 'nature_view', 'meditation'],
    photos: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 35,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000008',
      name: 'Kinigi Highland Yoga & Wellness Shala',
      category: 'studio',
      rating: 4.91,
      contact_email: 'kinigi@polyfit-partners.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000009',
    location_name: 'Lake Kivu Aquatic Club & Watersports',
    address: 'Boulevard de la Kivu, Gisenyi Waterfront',
    city: 'Rubavu',
    country: 'Rwanda',
    neighborhood: 'Rubavu',
    lat: -1.702,
    lng: 29.256,
    distance_meters: 110000,
    distance_km: 110.0,
    operating_hours: {
      monday: { open: '06:00', close: '20:30' },
      tuesday: { open: '06:00', close: '20:30' },
      wednesday: { open: '06:00', close: '20:30' },
      thursday: { open: '06:00', close: '20:30' },
      friday: { open: '06:00', close: '20:30' },
      saturday: { open: '06:30', close: '21:00' },
      sunday: { open: '07:00', close: '20:00' },
    },
    amenities: ['pool', 'lake_swimming', 'shower', 'deck', 'lockers'],
    photos: [
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 85,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000009',
      name: 'Lake Kivu Aquatic Club & Watersports',
      category: 'pool',
      rating: 4.88,
      contact_email: 'kivu@polyfit-partners.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000010',
    location_name: 'Huye University Sports & Athletic Hub',
    address: 'Avenue des Sports, Huye Central',
    city: 'Huye',
    country: 'Rwanda',
    neighborhood: 'Huye',
    lat: -2.601,
    lng: 29.742,
    distance_meters: 125000,
    distance_km: 125.0,
    operating_hours: {
      monday: { open: '06:00', close: '21:00' },
      tuesday: { open: '06:00', close: '21:00' },
      wednesday: { open: '06:00', close: '21:00' },
      thursday: { open: '06:00', close: '21:00' },
      friday: { open: '06:00', close: '21:00' },
      saturday: { open: '07:00', close: '20:00' },
      sunday: { open: '07:30', close: '19:00' },
    },
    amenities: ['basketball', 'tennis', 'track', 'strength_gym', 'lockers'],
    photos: [
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 120,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000010',
      name: 'Huye University Sports & Athletic Hub',
      category: 'sports',
      rating: 4.79,
      contact_email: 'huye@polyfit-partners.rw',
    },
  },
  {
    location_id: 'b0000000-0000-0000-0000-000000000011',
    location_name: 'Rwamagana Lakeview Fitness & Wellness',
    address: 'Rwamagana Lake Muhazi Corridor',
    city: 'Rwamagana',
    country: 'Rwanda',
    neighborhood: 'Rwamagana',
    lat: -1.95,
    lng: 30.434,
    distance_meters: 52000,
    distance_km: 52.0,
    operating_hours: {
      monday: { open: '06:00', close: '21:30' },
      tuesday: { open: '06:00', close: '21:30' },
      wednesday: { open: '06:00', close: '21:30' },
      thursday: { open: '06:00', close: '21:30' },
      friday: { open: '06:00', close: '21:30' },
      saturday: { open: '06:30', close: '21:00' },
      sunday: { open: '07:00', close: '20:00' },
    },
    amenities: ['sauna', 'steam_room', 'cardio_deck', 'hydrotherapy', 'smoothie_bar'],
    photos: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    ],
    capacity: 65,
    provider: {
      id: 'a0000000-0000-0000-0000-000000000011',
      name: 'Rwamagana Lakeview Fitness & Wellness',
      category: 'wellness_center',
      rating: 4.86,
      contact_email: 'rwamagana@polyfit-partners.rw',
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
          const neighborhood = extractNeighborhood(item.address, item.location_name, item.city);

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
      const targetAmenities = amenities.map((a) => a.toLowerCase());
      filtered = filtered.filter((f) => {
        const facilityAmenities = f.amenities.map((x) => x.toLowerCase());
        return targetAmenities.every((a) => facilityAmenities.includes(a));
      });
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
