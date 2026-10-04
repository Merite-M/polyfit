/**
 * Corporate Onboarding & Authentication Types (PF-105)
 */

export interface CorporateOrganization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo_url: string | null;
}

export interface BenefitPackage {
  id: string | null;
  tier: 'basic' | 'standard' | 'premium' | 'executive';
  name: string;
  max_monthly_visits: number | null;
  subsidy_percentage: number;
  is_fully_sponsored: boolean;
  co_pay_percentage: number;
  monthly_cost_rwf: number;
  allowed_categories: string[];
}

export interface EmployeeProfile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  tier: string;
  status: string;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface DomainVerificationResult {
  recognized: boolean;
  cached?: boolean;
  organization: CorporateOrganization;
  benefit: BenefitPackage;
  message: string;
}

export interface InviteVerificationResult {
  recognized: boolean;
  method: 'hr_invite_code';
  code: string;
  email: string | null;
  employee_name: string | null;
  organization: CorporateOrganization;
  benefit: BenefitPackage;
  message: string;
}

export interface RequestAccessResult {
  success: boolean;
  message: string;
  email: string;
  expires_in_seconds: number;
  demo_otp?: string;
}

export interface VerifyAccessResult {
  success: boolean;
  message: string;
  session: AuthSession;
  employee: EmployeeProfile;
  organization: CorporateOrganization;
  benefit: BenefitPackage;
}

export interface BenefitActivationResult {
  success: boolean;
  message: string;
  activated_at: string;
  offline_token_seed: string;
  totp_step_seconds: number;
  employee: EmployeeProfile;
}

export type OnboardingStep = 'welcome' | 'otp' | 'subsidy' | 'permissions' | 'completed';

export interface VerifiedVisitReceipt {
  id: string;
  providerName: string;
  locationName: string;
  address: string;
  category: 'gym' | 'pool' | 'studio' | 'clinic' | 'wellness_center' | 'sports';
  checkInAt: string;
  verificationMethod: 'totp_qr' | 'plaque_scan' | 'manual_pin';
  status: 'verified' | 'completed';
  totpTokenHash?: string | null;
  facilityCity?: string;
}

export interface BenefitUsageTelemetry {
  tier: string;
  name: string;
  usedVisits: number;
  maxMonthlyVisits: number | null;
  remainingVisits: number | 'unlimited';
  quotaPercentage: number;
  resetDate: string;
  daysRemainingInCycle: number;
  isUnlimited: boolean;
  subsidyPercentage: number;
  coPayPercentage: number;
  isFullySponsored: boolean;
  allowedCategories: string[];
}

export interface EmployeeNotificationSettings {
  checkInAlerts: boolean;
  quotaLowAlerts: boolean;
  networkAdditionsAlerts: boolean;
}

export interface BenefitPolicyFaq {
  question: string;
  answer: string;
}
