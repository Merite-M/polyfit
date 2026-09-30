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
  phone_number: '788 123 456',
  whatsapp_number: '788 123 456',
  instagram_handle: '',
  website_url: '',

  description: '',
  important_notice: 'Please bring your corporate ID or PolyFit mobile pass for verified check-in.',

  first_checkin_rules: {
    booking_required: false,
    registration_form_required: true,
    guided_tour_mandatory: false,
    arrive_early_minutes: 10,
  },
  recommended_gear: ['Clean indoor athletic sneakers', 'Training towel', 'Hydration bottle'],

  amenities: ['Lockers', 'Showers', 'High-Speed Wi-Fi', 'Free Parking'],

  logo_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=300',
  cover_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=1200',
  entrance_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800',
  gallery_urls: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800',
  ],

  payout_method: 'bank',
  bank_name: 'Bank of Kigali (BK)',
  account_name: '',
  account_number: '',
  swift_code: 'BKIGRWRW',
  momo_provider: 'mtn',
  momo_code: '',
  momo_phone: '',
  tax_id: '',
};

export const RWANDAN_BANKS = [
  { name: 'Bank of Kigali (BK)', swift: 'BKIGRWRW' },
  { name: 'I&M Bank Rwanda', swift: 'BCRWRWRW' },
  { name: 'Equity Bank Rwanda', swift: 'EQBLRWRW' },
  { name: 'BPR Bank Rwanda (Atlas Mara)', swift: 'BPRWRWRW' },
  { name: 'Ecobank Rwanda', swift: 'ECOCRWRW' },
  { name: 'Cogebanque (Equity)', swift: 'COGBRWRW' },
  { name: 'NCBA Bank Rwanda', swift: 'NCBARWRW' },
  { name: 'Access Bank Rwanda', swift: 'ACCERWRW' },
];

export const KIGALI_DISTRICT_PRESETS = [
  { name: 'Kimihurura (Diplomatic / Gastronomy Hub)', lat: -1.9536, lng: 30.0924 },
  { name: 'Kiyovu (Central Business District)', lat: -1.956, lng: 30.06 },
  { name: 'Nyarutarama (Golf / Tennis Corridor)', lat: -1.9351, lng: 30.1035 },
  { name: 'Gishushu (RDB / Parliament Corridor)', lat: -1.948, lng: 30.088 },
  { name: 'Remera (BK Arena & Sports Hub)', lat: -1.9615, lng: 30.113 },
  { name: 'Kacyiru (Ministries / Embassy Heights)', lat: -1.9385, lng: 30.076 },
  { name: 'Rugunga (Cercle Sportif District)', lat: -1.968, lng: 30.065 },
  { name: 'Musanze (Northern Tourism Hub)', lat: -1.498, lng: 29.634 },
  { name: 'Rubavu (Lake Kivu Waterfront)', lat: -1.702, lng: 29.256 },
];

export const AMENITY_CATEGORIES = [
  {
    category: 'General & Comfort',
    items: [
      'Lockers',
      'High-Speed Wi-Fi',
      'Hot Showers',
      'Hairdryer',
      'Drinking Fountain',
      'Coworking Lounge',
      'Free Parking',
      'Wheelchair Accessible',
      'Air Conditioning',
    ],
  },
  {
    category: 'Aquatic & Thermal',
    items: [
      '50m Olympic Lap Pool',
      'Heated Swimming Pool',
      'Finnish Dry Sauna',
      'Eucalyptus Steam Room',
      'Ice Bath / Cold Plunge',
      'Fresh Towel Service',
    ],
  },
  {
    category: 'Studio & Mind-Body',
    items: [
      'Yoga Mats Provided',
      'Reformer Pilates Machines',
      'Grippy Socks Required',
      'Yoga Blocks & Straps',
      'Sound Bath Bowls',
      'Ballet Barre',
    ],
  },
  {
    category: 'Racquet & Court Sports',
    items: [
      'Clay Tennis Courts',
      'Squash Courts',
      'Padel Courts',
      'Badminton Courts',
      'Equipment Rental (Racquets/Balls)',
      'Floodlit Night Courts',
    ],
  },
  {
    category: 'Health & Assessment',
    items: [
      'InBody Bioimpedance Scale',
      'Certified Nutritionist Desk',
      'Physiotherapy Consultation Desk',
      'Heart Rate Monitor Loan',
    ],
  },
];
