/**
 * PolyFit Mobile Employee App — Demo Account Fixtures
 * Extracted from auth-store.ts for clean separation between production auth and demo mocks.
 */

import {
  CorporateOrganization,
  BenefitPackage,
  EmployeeProfile,
  BenefitUsageTelemetry,
  VerifiedVisitReceipt,
} from '@/types/auth';

export interface DemoAccountData {
  email: string;
  organization: CorporateOrganization;
  benefit: BenefitPackage;
  employee: EmployeeProfile;
  benefitTelemetry: BenefitUsageTelemetry;
  recentVisits: VerifiedVisitReceipt[];
  session: { access_token: string; token_type: string; expires_in: number };
  demoOtp: string;
}

export function createDemoAccounts(): { bk: DemoAccountData; techcorp: DemoAccountData } {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysRem = Math.max(1, Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const bkOrg: CorporateOrganization = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Bank of Kigali',
    slug: 'bank-of-kigali',
    domain: 'bk.rw',
    logo_url: null,
  };

  const bkBenefit: BenefitPackage = {
    id: 'b0000000-0000-0000-0000-000000000011',
    tier: 'standard',
    name: 'Bank of Kigali Standard Corporate Tier',
    max_monthly_visits: 12,
    subsidy_percentage: 100,
    is_fully_sponsored: true,
    co_pay_percentage: 0,
    monthly_cost_rwf: 0,
    allowed_categories: ['gym', 'pool', 'studio', 'clinic', 'wellness_center'],
  };

  const bkEmployee: EmployeeProfile = {
    id: 'b0000000-0000-0000-0000-000000000021',
    full_name: 'Jean Mugisha',
    email: 'jean.mugisha@bk.rw',
    department: 'Commercial Banking',
    tier: 'standard',
    status: 'active',
  };

  const bkTelemetry: BenefitUsageTelemetry = {
    tier: 'standard',
    name: 'Bank of Kigali Standard Corporate Tier',
    usedVisits: 8,
    maxMonthlyVisits: 12,
    remainingVisits: 4,
    quotaPercentage: 67,
    resetDate: nextMonth.toISOString(),
    daysRemainingInCycle: daysRem,
    isUnlimited: false,
    subsidyPercentage: 100,
    coPayPercentage: 0,
    isFullySponsored: true,
    allowedCategories: ['gym', 'pool', 'studio', 'clinic', 'wellness_center'],
  };

  const bkVisits: VerifiedVisitReceipt[] = [
    {
      id: 'vis_bk_1',
      providerName: 'Waka Fitness',
      locationName: 'Waka Fitness Kimihurura',
      address: 'KG 7 Ave, Kigali Heights 3rd Floor',
      category: 'gym',
      checkInAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      verificationMethod: 'totp_qr',
      status: 'verified',
      totpTokenHash: '8f2a1b9c3e...44d',
      facilityCity: 'Kimihurura, Kigali',
    },
    {
      id: 'vis_bk_2',
      providerName: 'Cercle Sportif de Kigali',
      locationName: 'Olympic Swimming Facility',
      address: 'KN 3 Ave, Kiyovu',
      category: 'pool',
      checkInAt: new Date(Date.now() - 1000 * 60 * 60 * 64).toISOString(),
      verificationMethod: 'plaque_scan',
      status: 'verified',
      totpTokenHash: 'a1b2c3d4e5...88a',
      facilityCity: 'Kiyovu, Kigali',
    },
    {
      id: 'vis_bk_3',
      providerName: 'Cali Fitness',
      locationName: 'Cali Club Nyarutarama',
      address: 'KG 9 Ave, Nyarutarama Tennis Club',
      category: 'gym',
      checkInAt: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(),
      verificationMethod: 'totp_qr',
      status: 'verified',
      totpTokenHash: '3d9e1f2a4b...55c',
      facilityCity: 'Nyarutarama, Kigali',
    },
  ];

  const tcOrg: CorporateOrganization = {
    id: 'c79a9982-4477-4336-a24b-561419f6c43b',
    name: 'TechCorp Rwanda',
    slug: 'techcorp-rwanda',
    domain: 'techcorp.rw',
    logo_url: null,
  };

  const tcBenefit: BenefitPackage = {
    id: '5894f62b-01f2-485e-8083-45565786c5d7',
    tier: 'standard',
    name: 'TechCorp Standard Wellness Plan',
    max_monthly_visits: 8,
    subsidy_percentage: 85,
    is_fully_sponsored: false,
    co_pay_percentage: 15,
    monthly_cost_rwf: 5000,
    allowed_categories: ['gym', 'pool', 'studio'],
  };

  const tcEmployee: EmployeeProfile = {
    id: '00fbe4e1-86aa-44bc-ad89-fcce6fb75687',
    full_name: 'Jean Mugabo',
    email: 'jean.mugabo@techcorp.rw',
    department: 'Engineering',
    tier: 'standard',
    status: 'active',
  };

  const tcTelemetry: BenefitUsageTelemetry = {
    tier: 'standard',
    name: 'TechCorp Standard Wellness Plan',
    usedVisits: 5,
    maxMonthlyVisits: 8,
    remainingVisits: 3,
    quotaPercentage: 63,
    resetDate: nextMonth.toISOString(),
    daysRemainingInCycle: daysRem,
    isUnlimited: false,
    subsidyPercentage: 85,
    coPayPercentage: 15,
    isFullySponsored: false,
    allowedCategories: ['gym', 'pool', 'studio'],
  };

  const tcVisits: VerifiedVisitReceipt[] = [
    {
      id: 'vis_tc_1',
      providerName: 'Waka Fitness',
      locationName: 'Waka Fitness Kimihurura',
      address: 'KG 7 Ave, Kigali Heights 3rd Floor',
      category: 'gym',
      checkInAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
      verificationMethod: 'totp_qr',
      status: 'verified',
      totpTokenHash: '2c4e6a8b...12a',
      facilityCity: 'Kimihurura, Kigali',
    },
    {
      id: 'vis_tc_2',
      providerName: 'Zenith Yoga Studio',
      locationName: 'Zenith Wellness Sanctuary',
      address: 'KG 549 St, Gacuriro',
      category: 'studio',
      checkInAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
      verificationMethod: 'plaque_scan',
      status: 'verified',
      totpTokenHash: '6f8a9b1c...99d',
      facilityCity: 'Gacuriro, Kigali',
    },
  ];

  return {
    bk: {
      email: 'jean.mugisha@bk.rw',
      organization: bkOrg,
      benefit: bkBenefit,
      employee: bkEmployee,
      benefitTelemetry: bkTelemetry,
      recentVisits: bkVisits,
      session: { access_token: 'demo_bk_token', token_type: 'bearer', expires_in: 86400 },
      demoOtp: '123456',
    },
    techcorp: {
      email: 'jean.mugabo@techcorp.rw',
      organization: tcOrg,
      benefit: tcBenefit,
      employee: tcEmployee,
      benefitTelemetry: tcTelemetry,
      recentVisits: tcVisits,
      session: { access_token: 'demo_tc_token', token_type: 'bearer', expires_in: 86400 },
      demoOtp: '123456',
    },
  };
}
