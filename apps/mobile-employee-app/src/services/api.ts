/**
 * PolyFit Corporate Employee Mobile API Service
 * Production API client adhering to Zero Demo Policy.
 * Communicates directly with PolyFit Backend Core.
 */

import {
  DomainVerificationResult,
  InviteVerificationResult,
  RequestAccessResult,
  VerifyAccessResult,
  BenefitActivationResult,
} from '@/types/auth';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://polyfit-backend.onrender.com';

/**
 * 1. Verify Corporate Email Domain or Mobile Phone (< 500ms SLA)
 */
export async function verifyDomain(identifier: string): Promise<DomainVerificationResult> {
  const clean = identifier.trim();
  if (!clean) {
    throw new Error('Please enter a valid work email or phone number.');
  }

  const isPhone = !clean.includes('@') && clean.replace(/[^0-9]/g, '').length >= 8;

  const res = await fetch(`${API_BASE_URL}/api/employee/auth/resolve-identity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(isPhone ? { phone: clean, identifier: clean } : { email: clean.toLowerCase(), identifier: clean.toLowerCase() }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || (isPhone ? `Mobile ${clean} is not registered on any active corporate roster.` : `Corporate domain is not enrolled in PolyFit.`));
  }

  return data;
}

/**
 * 2. Verify HR Invite Code (Fallback Pathway)
 */
export async function verifyInviteCode(code: string): Promise<InviteVerificationResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    throw new Error('Please enter a valid HR activation code.');
  }

  const res = await fetch(`${API_BASE_URL}/api/employee/auth/verify-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: cleanCode }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Invite code "${cleanCode}" is invalid or has expired.`);
  }

  return data;
}

/**
 * 3. Request Access Code (OTP via Email or SMS/WhatsApp)
 */
export async function requestAccess(identifier: string): Promise<RequestAccessResult> {
  const clean = identifier.trim();
  if (!clean) {
    throw new Error('Valid identifier is required to request access.');
  }

  const isPhone = !clean.includes('@') && clean.replace(/[^0-9]/g, '').length >= 8;

  const res = await fetch(`${API_BASE_URL}/api/employee/auth/request-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(isPhone ? { phone: clean, identifier: clean } : { email: clean.toLowerCase(), identifier: clean.toLowerCase() }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to dispatch verification code. Please check your network and try again.');
  }

  // Ensure demo_otp is never passed to client state
  const { demo_otp, ...cleanResult } = data;
  return cleanResult;
}

/**
 * 4. Verify Access Code & Establish Session
 */
export async function verifyAccess(identifier: string, code: string): Promise<VerifyAccessResult> {
  const clean = identifier.trim();
  const cleanCode = code.trim();
  if (!clean || !cleanCode) {
    throw new Error('Work identifier and 6-digit verification code are required.');
  }

  const isPhone = !clean.includes('@') && clean.replace(/[^0-9]/g, '').length >= 8;

  const res = await fetch(`${API_BASE_URL}/api/employee/auth/verify-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...(isPhone ? { phone: clean, identifier: clean } : { email: clean.toLowerCase(), identifier: clean.toLowerCase() }),
      code: cleanCode,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Invalid or expired verification code. Please request a new code.');
  }

  return data;
}

/**
 * 5. Activate Corporate Benefit & Provision Cryptographic Offline Pass Seed
 */
export async function activateBenefit(employeeId: string, benefitId?: string | null): Promise<BenefitActivationResult> {
  if (!employeeId) {
    throw new Error('Employee ID is required for benefit activation.');
  }

  const res = await fetch(`${API_BASE_URL}/api/employee/benefit/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employee_id: employeeId, benefit_id: benefitId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to activate corporate wellness benefit.');
  }

  return data;
}

/**
 * 6. Fetch Employee Profile & Benefit Status (Tab 3: Me)
 */
export async function fetchEmployeeMe(token?: string | null, employeeId?: string | null): Promise<{
  employee: any;
  organization: any;
  benefit: any;
  telemetry: any;
}> {
  const url = employeeId
    ? `${API_BASE_URL}/api/employee/me?employee_id=${encodeURIComponent(employeeId)}`
    : `${API_BASE_URL}/api/employee/me`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Unable to load employee profile from server.');
  }

  const data = await res.json();
  const b = data.benefit || {};
  const maxVisits = b.max_monthly_visits ?? null;
  const usedVisits = b.used_visits ?? 0;
  const resetDate = b.reset_date || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();
  const daysRemaining = Math.max(1, Math.ceil((new Date(resetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const quotaPct = maxVisits ? Math.min(100, Math.round((usedVisits / maxVisits) * 100)) : 0;

  return {
    employee: data.employee,
    organization: data.organization,
    benefit: {
      id: b.id,
      tier: b.tier || 'standard',
      name: b.name || 'Corporate Wellness Tier',
      max_monthly_visits: maxVisits,
      subsidy_percentage: b.subsidy_percentage ?? 100,
      is_fully_sponsored: (b.subsidy_percentage ?? 100) >= 100,
      co_pay_percentage: b.co_pay_percentage ?? 0,
      monthly_cost_rwf: b.monthly_cost_rwf ?? 0,
      allowed_categories: b.allowed_provider_categories || ['gym', 'pool', 'studio', 'clinic', 'wellness_center'],
    },
    telemetry: {
      tier: b.tier || 'standard',
      name: b.name || 'Corporate Wellness Tier',
      usedVisits,
      maxMonthlyVisits: maxVisits,
      remainingVisits: b.remaining_visits ?? (maxVisits !== null ? Math.max(0, maxVisits - usedVisits) : 'unlimited'),
      quotaPercentage: quotaPct,
      streakCount: data.telemetry?.streakCount ?? b.streak_count ?? 0,
      resetDate,
      daysRemainingInCycle: daysRemaining,
      isUnlimited: maxVisits === null,
      subsidyPercentage: b.subsidy_percentage ?? 100,
      coPayPercentage: b.co_pay_percentage ?? 0,
      isFullySponsored: (b.subsidy_percentage ?? 100) >= 100,
      allowedCategories: b.allowed_provider_categories || ['gym', 'pool', 'studio', 'clinic', 'wellness_center'],
    },
  };
}

/**
 * 7. Fetch Verified Visits History (Tab 3: Me)
 */
export async function fetchEmployeeVisits(token?: string | null, employeeId?: string | null): Promise<any[]> {
  const url = employeeId
    ? `${API_BASE_URL}/api/employee/visits?employee_id=${encodeURIComponent(employeeId)}&limit=10`
    : `${API_BASE_URL}/api/employee/visits?limit=10`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const rawVisits = Array.isArray(data) ? data : data.visits || [];
  return rawVisits.map((v: any) => ({
    id: v.id,
    providerName: v.provider_locations?.providers?.name || v.provider_name || 'Wellness Partner',
    locationName: v.provider_locations?.name || v.location_name || 'Kigali Facility',
    address: v.provider_locations?.address || 'Kigali, Rwanda',
    category: v.provider_locations?.providers?.category || 'gym',
    checkInAt: v.check_in_at || new Date().toISOString(),
    verificationMethod: v.verification_method === 'totp' ? 'totp_qr' : 'plaque_scan',
    status: v.status || 'verified',
    totpTokenHash: v.totp_token_hash ? `${v.totp_token_hash.slice(0, 10)}...` : undefined,
    facilityCity: v.provider_locations?.city || 'Kigali',
  }));
}
