/**
 * PolyFit Shared Types v1.0
 * 
 * This package contains shared TypeScript types used across:
 * - Backend API
 * - Web application
 * - Mobile application
 * 
 * Types are organized by domain:
 * - Database types (from Supabase schema)
 * - API request/response types
 * - Common domain types
 */

// ============================================================================
// PROVIDER CATEGORIES
// ============================================================================

export type ProviderCategory = 
  | 'gym'
  | 'pool'
  | 'studio'
  | 'wellness_center'
  | 'clinic'
  | 'sports';

// ============================================================================
// USER ROLES
// ============================================================================

export type UserRole = 
  | 'superadmin'
  | 'employer_admin'
  | 'employer_staff'
  | 'provider_admin'
  | 'provider_staff'
  | 'employee';

// ============================================================================
// DATABASE TYPES (based on Supabase schema)
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  tax_id: string;
  billing_email: string;
  contact_email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: 'pending_review' | 'active' | 'inactive' | 'suspended' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ProviderLocation {
  id: string;
  provider_id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  operating_hours: Record<string, string>;
  amenities: string[];
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  employee_id: string;
  department: string;
  status: 'active' | 'inactive' | 'terminated';
  created_at: string;
  updated_at: string;
}

export interface Benefit {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  type: 'fitness' | 'wellness' | 'other';
  allowance_per_month: number;
  visits_per_month: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Eligibility {
  id: string;
  employee_id: string;
  benefit_id: string;
  allowance_remaining: number;
  visits_remaining: number;
  valid_from: string;
  valid_until: string;
  status: 'active' | 'expired' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  employee_id: string;
  provider_location_id: string;
  benefit_id: string;
  check_in_time: string;
  check_out_time: string | null;
  totp_code: string;
  location_verified: boolean;
  location_match: boolean;
  distance_meters: number | null;
  status: 'verified' | 'pending' | 'disputed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  total_visits: number;
  total_amount: number;
  tax_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface Settlement {
  id: string;
  provider_id: string;
  invoice_id: string;
  settlement_number: string;
  period_start: string;
  period_end: string;
  total_visits: number;
  total_amount: number;
  fee_amount: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface VisitCheckInRequest {
  employee_id: string;
  provider_location_id: string;
  totp_code: string;
  lat: number;
  lng: number;
}

export interface VisitCheckInResponse {
  visit: Visit;
  eligible: boolean;
  allowance_remaining: number;
  visits_remaining: number;
}

// ============================================================================
// COMMON DOMAIN TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organization_id?: string;
  provider_id?: string;
}

export interface DiscoveredFacility {
  id: string;
  provider_id: string;
  name: string;
  category: ProviderCategory;
  address: string;
  city: string;
  lat: number;
  lng: number;
  distance_meters?: number;
  amenities: string[];
  operating_hours: Record<string, string>;
}

export interface UtilizationSummary {
  total_eligible: number;
  registered_employees: number;
  active_beneficiaries: number;
  total_visits: number;
  new_employees_30d: number;
  new_beneficiaries_30d: number;
  avg_visits_per_active: number;
}
