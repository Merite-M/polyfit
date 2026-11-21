export interface SplitShift {
  open: string;
  close: string;
}

export interface DaySchedule {
  is_closed: boolean;
  shifts: SplitShift[];
}

export type WeekSchedule = Record<string, DaySchedule>;

export interface FirstCheckinRules {
  booking_required: boolean;
  registration_form_required: boolean;
  guided_tour_mandatory: boolean;
  arrive_early_minutes: number;
}

export interface WizardLocationState {
  // Basic & Geolocation
  name: string;
  city: string;
  address: string;
  country: string;
  lat: number;
  lng: number;
  geofence_radius_meters: number;
  capacity: number;

  // Step 1: Hours & Split-Shifts
  operating_hours: WeekSchedule;

  // Step 2: Contact Details
  phone_country_code: string;
  phone_number: string;
  whatsapp_number: string;
  instagram_handle: string;
  website_url: string;

  // Step 3: Description & Guidelines
  description: string;
  important_notice: string;

  // Step 4: First Check-in Requirements
  first_checkin_rules: FirstCheckinRules;
  recommended_gear: string[];

  // Step 5: Multi-Category Amenities
  amenities: string[];

  // Steps 6 - 9: Visual Media
  logo_url: string;
  cover_url: string;
  entrance_url: string;
  gallery_urls: string[];

  // Step 10: Payout Account
  payout_method: 'bank' | 'momo';
  bank_name: string;
  account_name: string;
  account_number: string;
  swift_code: string;
  momo_provider: 'mtn' | 'airtel';
  momo_code: string;
  momo_phone: string;
  tax_id: string; // RRA TIN
}

export const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon', fullLabel: 'Monday' },
  { key: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { key: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
  { key: 'friday', label: 'Fri', fullLabel: 'Friday' },
  { key: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
  { key: 'sunday', label: 'Sun', fullLabel: 'Sunday' },
];

export const INITIAL_WIZARD_STATE: WizardLocationState = {
  name: '',
  city: 'Kigali',
  address: '',
  country: 'Rwanda',
  lat: -1.9536,
  lng: 30.0924,
  geofence_radius_meters: 150,
  capacity: 120,

  operating_hours: {
    monday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
    tuesday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
    wednesday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
    thursday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
    friday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
    saturday: { is_closed: false, shifts: [{ open: '08:00', close: '20:00' }] },
    sunday: { is_closed: false, shifts: [{ open: '09:00', close: '18:00' }] },
  },

  phone_country_code: '+250',
  phone_number: '',
  whatsapp_number: '',
  instagram_handle: '',
  website_url: '',

  description: '',
  important_notice: '',

  first_checkin_rules: {
    booking_required: false,
    registration_form_required: false,
    guided_tour_mandatory: false,
    arrive_early_minutes: 0,
  },
  recommended_gear: [],

  amenities: [],

  logo_url: '',
  cover_url: '',
  entrance_url: '',
  gallery_urls: [],

  payout_method: 'bank',
  bank_name: '',
  account_name: '',
  account_number: '',
  swift_code: '',
  momo_provider: 'mtn',
  momo_code: '',
  momo_phone: '',
  tax_id: '',
};

import { RWANDAN_BANKS, type RwandanBank } from '@/lib/constants';
export { RWANDAN_BANKS, type RwandanBank };

export const KIGALI_DISTRICT_PRESETS = [
  { name: 'Kimihurura (Diplomatic / Gastronomy Hub)', lat: -1.9536, lng: 30.0924 },
  { name: 'Kiyovu (Central Business District)', lat: -1.956, lng: 30.06 },
  { name: 'Nyarutarama (Golf / Tennis Corridor)', lat: -1.9351, lng: 30.1035 },
  { name: 'Gishushu (RDB / Parliament Corridor)', lat: -1.948, lng: 30.088 },
  { name: 'Remera (BK Arena & Sports Hub)', lat: -1.9615, lng: 30.113 },
  { name: 'Kacyiru (Ministries / Embassy Heights)', lat: -1.9385, lng: 30.076 },
  { name: 'Rugunga (Sports & Aquatic District)', lat: -1.968, lng: 30.065 },
  { name: 'Musanze (Northern Tourism Hub)', lat: -1.498, lng: 29.634 },
  { name: 'Rubavu (Lake Kivu Waterfront)', lat: -1.702, lng: 29.256 },
];

export const AMENITY_CATEGORIES = [
  {
    category: 'Fitness & Strength Floor',
    items: [
      'Olympic Lifting Platforms & Eleiko Barbells',
      'Heavy Dumbbells (up to 50kg) & Benches',
      'Squat Racks & Power Cages',
      'Technogym & LifeFitness Treadmills',
      'Concept2 Rowers & SkiErgs',
      'Assault AirBikes & StairMasters',
      'Indoor Cycling / Spinning Studio',
      'Functional Turf Track & Sleds',
      'Boxing Heavy Bags & Speedballs',
    ],
  },
  {
    category: 'Aquatics & Thermal Wellness',
    items: [
      '25m Semi-Olympic Heated Lap Pool',
      'Eucalyptus Wet Steam Room',
      'Finnish Dry Sauna',
      'Ice Bath & Cold Plunge Tub',
      'Poolside Sun Loungers & Umbrellas',
      'Fresh Microfiber Towel Service',
    ],
  },
  {
    category: 'Group Studios & Mind-Body',
    items: [
      'Aerobics & Afro-Beats Dance Floor',
      'Reformer Pilates Machines',
      'Yoga Mats, Blocks & Straps Provided',
      'Sound Bath & Guided Meditation Area',
      'Ballet Barre & Stretching Area',
    ],
  },
  {
    category: 'Sports & Racket Courts',
    items: [
      'Padel Courts (Panoramic Glass, Floodlit)',
      'Clay Tennis Courts',
      'Glass-Back Squash Courts',
      'Badminton Courts',
      'Racket & Ball Equipment Rental',
    ],
  },
  {
    category: 'Hospitality, Power & Health',
    items: [
      '24/7 Backup Generator (Zero Outage)',
      'Dedicated Clean Water Reserve & Solar Hot Water',
      'Guarded Secure Parking',
      'Protein Shake & Rwandan Coffee Cafe',
      'Individual Lockers with Digital Padlocks',
      'Private Hot Showers & Vanity Dressing Suites',
      'High-Speed Fiber Wi-Fi',
      'Air Conditioning & Natural Airflow',
      'InBody Bioimpedance Body Composition Scan',
      'Sports Physiotherapy & Recovery Clinic',
    ],
  },
];
