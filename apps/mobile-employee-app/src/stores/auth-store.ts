/**
 * PolyFit Corporate Employee Auth & Onboarding Store (Zustand + SecureStore)
 * PF-105: Frictionless Corporate Employee Onboarding & Benefit Activation
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import {
  CorporateOrganization,
  BenefitPackage,
  EmployeeProfile,
  AuthSession,
  OnboardingStep,
} from '@/types/auth';
import {
  verifyDomain,
  verifyInviteCode,
  requestAccess,
  verifyAccess,
  activateBenefit,
} from '@/services/api';

// Safe SecureStore accessor with web fallback
async function saveSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } else {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    }
  } catch (e) {
    console.warn('[saveSecureItem] Note:', e);
  }
}

async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null;
    } else {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    }
  } catch (e) {
    console.warn('[getSecureItem] Note:', e);
    return null;
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } else {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    }
  } catch (e) {
    console.warn('[deleteSecureItem] Note:', e);
  }
}

const STORAGE_KEY_TOKEN = 'polyfit_auth_token';
const STORAGE_KEY_SEED = 'polyfit_offline_pass_seed';
const STORAGE_KEY_PROFILE = 'polyfit_employee_profile';
const STORAGE_KEY_BENEFIT = 'polyfit_benefit_package';
const STORAGE_KEY_ORG = 'polyfit_organization';
const STORAGE_KEY_ACTIVATED = 'polyfit_benefit_activated';

interface AuthState {
  step: OnboardingStep;
  email: string;
  inviteCode: string;
  authMethod: 'email' | 'invite';
  organization: CorporateOrganization | null;
  benefit: BenefitPackage | null;
  employee: EmployeeProfile | null;
  session: AuthSession | null;
  offlineTokenSeed: string | null;
  isBenefitActivated: boolean;
  biometricsEnabled: boolean;
  locationGranted: boolean;
  isLoading: boolean;
  error: string | null;
  demoOtp: string | null;

  // Actions
  setStep: (step: OnboardingStep) => void;
  setEmail: (email: string) => void;
  setInviteCode: (code: string) => void;
  setAuthMethod: (method: 'email' | 'invite') => void;
  clearError: () => void;

  resolveEmailDomain: (email: string) => Promise<boolean>;
  resolveInviteToken: (code: string) => Promise<boolean>;
  submitRequestAccess: () => Promise<boolean>;
  submitVerifyAccess: (code: string) => Promise<boolean>;
  submitActivateBenefit: () => Promise<boolean>;
  setBiometrics: (enabled: boolean) => void;
  setLocationPermission: (granted: boolean) => void;

  loadDemoAccount: (orgType: 'bk' | 'techcorp') => Promise<void>;
  initializeSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  step: 'welcome',
  email: '',
  inviteCode: '',
  authMethod: 'email',
  organization: null,
  benefit: null,
  employee: null,
  session: null,
  offlineTokenSeed: null,
  isBenefitActivated: false,
  biometricsEnabled: false,
  locationGranted: false,
  isLoading: false,
  error: null,
  demoOtp: null,

  setStep: (step) => set({ step, error: null }),
  setEmail: (email) => set({ email, error: null }),
  setInviteCode: (inviteCode) => set({ inviteCode, error: null }),
  setAuthMethod: (authMethod) => set({ authMethod, error: null }),
  clearError: () => set({ error: null }),

  resolveEmailDomain: async (email: string) => {
    if (!email || !email.includes('@')) {
      set({ error: 'Please enter a valid corporate email address' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const result = await verifyDomain(email);
      set({
        isLoading: false,
        organization: result.organization,
        benefit: result.benefit,
        email: email.trim().toLowerCase(),
        error: null,
      });
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Corporate domain not recognized',
        organization: null,
        benefit: null,
      });
      return false;
    }
  },

  resolveInviteToken: async (code: string) => {
    if (!code || code.trim().length < 3) {
      set({ error: 'Please enter a valid HR invite code' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const result = await verifyInviteCode(code);
      set({
        isLoading: false,
        organization: result.organization,
        benefit: result.benefit,
        inviteCode: code.trim().toUpperCase(),
        email: result.email || get().email,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Invalid or expired HR invite code',
        organization: null,
        benefit: null,
      });
      return false;
    }
  },

  submitRequestAccess: async () => {
    const { email } = get();
    if (!email) {
      set({ error: 'Corporate email is required to send verification code' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const result = await requestAccess(email);
      set({
        isLoading: false,
        demoOtp: result.demo_otp || null,
        step: 'otp',
        error: null,
      });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to dispatch verification code' });
      return false;
    }
  },

  submitVerifyAccess: async (code: string) => {
    const { email } = get();
    if (!email || !code) {
      set({ error: 'Email and 6-digit verification code are required' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const result = await verifyAccess(email, code);
      set({
        isLoading: false,
        session: result.session,
        employee: result.employee,
        organization: result.organization,
        benefit: result.benefit,
        step: 'subsidy',
        error: null,
      });

      // Persist auth token
      if (result.session?.access_token) {
        await saveSecureItem(STORAGE_KEY_TOKEN, result.session.access_token);
        await saveSecureItem(STORAGE_KEY_PROFILE, JSON.stringify(result.employee));
        await saveSecureItem(STORAGE_KEY_BENEFIT, JSON.stringify(result.benefit));
        await saveSecureItem(STORAGE_KEY_ORG, JSON.stringify(result.organization));
      }

      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Verification failed. Please check the code.' });
      return false;
    }
  },

  submitActivateBenefit: async () => {
    const { employee, benefit } = get();
    if (!employee?.id) {
      set({ error: 'Active employee profile required for benefit activation' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const result = await activateBenefit(employee.id, benefit?.id);
      const offlineSeed = result.offline_token_seed;

      // Securely store cryptographic pass seed for offline Tab 1 TOTP vault
      await saveSecureItem(STORAGE_KEY_SEED, offlineSeed);
      await saveSecureItem(STORAGE_KEY_ACTIVATED, 'true');

      set({
        isLoading: false,
        offlineTokenSeed: offlineSeed,
        isBenefitActivated: true,
        step: 'permissions',
        error: null,
      });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to activate benefit' });
      return false;
    }
  },

  setBiometrics: (enabled: boolean) => {
    set({ biometricsEnabled: enabled });
  },

  setLocationPermission: (granted: boolean) => {
    set({ locationGranted: granted });
  },

  loadDemoAccount: async (orgType: 'bk' | 'techcorp') => {
    set({ isLoading: true, error: null });

    if (orgType === 'bk') {
      const bkOrg: CorporateOrganization = {
        id: 'b0000000-0000-0000-0000-000000000001',
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

      set({
        email: 'jean.mugisha@bk.rw',
        organization: bkOrg,
        benefit: bkBenefit,
        employee: bkEmployee,
        session: { access_token: 'demo_bk_token', token_type: 'bearer', expires_in: 86400 },
        demoOtp: '123456',
        step: 'otp',
        isLoading: false,
      });
    } else {
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

      set({
        email: 'jean.mugabo@techcorp.rw',
        organization: tcOrg,
        benefit: tcBenefit,
        employee: tcEmployee,
        session: { access_token: 'demo_tc_token', token_type: 'bearer', expires_in: 86400 },
        demoOtp: '123456',
        step: 'otp',
        isLoading: false,
      });
    }
  },

  initializeSession: async () => {
    try {
      const token = await getSecureItem(STORAGE_KEY_TOKEN);
      const isActivated = await getSecureItem(STORAGE_KEY_ACTIVATED);
      const seed = await getSecureItem(STORAGE_KEY_SEED);
      const rawProfile = await getSecureItem(STORAGE_KEY_PROFILE);
      const rawBenefit = await getSecureItem(STORAGE_KEY_BENEFIT);
      const rawOrg = await getSecureItem(STORAGE_KEY_ORG);

      if (token && isActivated === 'true' && rawProfile) {
        set({
          session: { access_token: token, token_type: 'bearer', expires_in: 86400 },
          employee: JSON.parse(rawProfile),
          benefit: rawBenefit ? JSON.parse(rawBenefit) : null,
          organization: rawOrg ? JSON.parse(rawOrg) : null,
          offlineTokenSeed: seed,
          isBenefitActivated: true,
          step: 'completed',
        });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[initializeSession] Note:', e);
      return false;
    }
  },

  logout: async () => {
    await deleteSecureItem(STORAGE_KEY_TOKEN);
    await deleteSecureItem(STORAGE_KEY_SEED);
    await deleteSecureItem(STORAGE_KEY_PROFILE);
    await deleteSecureItem(STORAGE_KEY_BENEFIT);
    await deleteSecureItem(STORAGE_KEY_ORG);
    await deleteSecureItem(STORAGE_KEY_ACTIVATED);

    set({
      step: 'welcome',
      email: '',
      inviteCode: '',
      organization: null,
      benefit: null,
      employee: null,
      session: null,
      offlineTokenSeed: null,
      isBenefitActivated: false,
      demoOtp: null,
      error: null,
    });
  },
}));
