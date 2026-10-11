/**
 * PolyFit Shared Types v1.0
 * 
 * Single source of truth across:
 * - Backend API (apps/backend-core)
 * - Web Application (apps/web)
 * - Mobile Application (apps/mobile-employee-app)
 */

// ============================================================================
// PROVIDER CATEGORIES & ACTOR ROLES
// ============================================================================

export type ProviderCategory = 
  | 'gym'
  | 'pool'
  | 'studio'
  | 'wellness_center'
  | 'clinic'
  | 'sports';

export type UserRole = 
  | 'super_admin'
  | 'polyfit_ops'
  | 'org_admin'
  | 'provider_admin'
  | 'provider_staff'
  | 'employee';

// ============================================================================
// DATABASE / CORE DOMAIN TYPES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  domain?: string;
  allowed_domains?: string[];
  tax_id?: string;
  billing_email?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  logo_url?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at?: string;
}

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  email: string;
  phone?: string;
  address?: string;
  city: string;
  country: string;
  status: 'pending_review' | 'active' | 'inactive' | 'suspended' | 'rejected';
  rating?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProviderLocation {
  id: string;
  provider_id: string;
  name: string;
  address?: string;
  city: string;
  country?: string;
  lat: number;
  lng: number;
  operating_hours?: Record<string, any>;
  amenities?: string[];
  photos?: string[];
  capacity?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: string;
  org_id: string;
  full_name: string;
  email: string;
  employee_id_external?: string | null;
  department?: string;
  tier: string;
  status: 'active' | 'frozen' | 'terminated';
  created_at: string;
  updated_at?: string;
}

export interface Benefit {
  id: string;
  org_id: string;
  name: string;
  tier: 'starter' | 'standard' | 'executive' | string;
  description?: string;
  max_monthly_visits: number;
  co_pay_percentage: number;
  allowed_provider_categories: ProviderCategory[];
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at?: string;
}

export interface Eligibility {
  id: string;
  employee_id: string;
  benefit_id: string;
  status: 'active' | 'expired' | 'suspended';
  activated_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Visit {
  id: string;
  employee_id: string;
  provider_location_id: string;
  benefit_id?: string;
  check_in_time: string;
  check_out_time?: string | null;
  totp_code?: string;
  location_verified: boolean;
  distance_meters?: number | null;
  verification_method: 'totp' | 'reception_scan' | 'turnstile' | 'manual_override';
  status: 'verified' | 'pending' | 'disputed' | 'rejected';
  created_at: string;
}

export interface Invoice {
  id: string;
  org_id: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  total_visits: number;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'disputed';
  due_date: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  provider_id: string;
  settlement_number: string;
  period_start: string;
  period_end: string;
  total_visits: number;
  gross_amount: number;
  platform_fee_amount: number;
  net_payout_amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  created_at: string;
}

// ============================================================================
// PLATFORM CONFIG & PUBLIC DISCOVERY TYPES
// ============================================================================

export interface PlatformSettings {
  anti_passback_window_minutes: number;
  geofence_radius_meters: number;
  totp_step_seconds: number;
  max_device_resets_monthly: number;
  platform_fee_percentage: number;
}

export interface PricingTier {
  id: 'starter' | 'professional' | 'enterprise';
  name: string;
  badge: string;
  description: string;
  target: string;
  pricing: {
    RWF: { monthly: number; annual: number; period: string };
    USD: { monthly: number; annual: number; period: string };
  };
  popular: boolean;
  ctaText: string;
  ctaVariant: 'primary' | 'secondary' | 'outline';
  features: string[];
  notIncluded: string[];
}

export interface PlatformConfigResponse {
  success: boolean;
  timestamp: string;
  settings: PlatformSettings;
  network: {
    providers_count: number;
    locations_count: number;
    organizations_count: number;
    verified_visits_count: number;
  };
  pricing: PricingTier[];
  currency_rate: {
    RWF_PER_USD: number;
  };
}

export interface VerifyCompanyResponse {
  enrolled: boolean;
  domain: string;
  message?: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    industry?: string;
    logo_url?: string | null;
  };
  benefit?: {
    id: string;
    name: string;
    tier: string;
    max_monthly_visits: number;
    subsidy_percentage: number;
    co_pay_percentage: number;
    is_fully_sponsored: boolean;
    allowed_categories: string[];
  };
  claim_url?: string;
}
