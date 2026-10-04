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
  VerifiedVisitReceipt,
  BenefitUsageTelemetry,
  EmployeeNotificationSettings,
} from '@/types/auth';
import {
  verifyDomain,
  verifyInviteCode,
  requestAccess,
  verifyAccess,
  activateBenefit,
  fetchEmployeeMe,
  fetchEmployeeVisits,
} from '@/services/api';
import { createDemoAccounts } from '@/constants/demo-data';

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
const STORAGE_KEY_TELEMETRY = 'polyfit_benefit_telemetry';
const STORAGE_KEY_VISITS = 'polyfit_recent_visits';
const STORAGE_KEY_NOTIFICATIONS = 'polyfit_notification_settings';

const DEFAULT_NOTIFICATIONS: EmployeeNotificationSettings = {
  checkInAlerts: true,
  quotaLowAlerts: true,
  networkAdditionsAlerts: false,
};

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

  // PF-102 Profile & Benefit Telemetry
  benefitTelemetry: BenefitUsageTelemetry | null;
  recentVisits: VerifiedVisitReceipt[];
  notificationSettings: EmployeeNotificationSettings;
  isRefreshingProfile: boolean;

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

  // Profile actions (PF-102)
  refreshProfileAndVisits: () => Promise<void>;
  updateNotificationSettings: (settings: Partial<EmployeeNotificationSettings>) => Promise<void>;

  recordSuccessfulCheckIn: (visit: VerifiedVisitReceipt) => void;
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

  // PF-102 State
  benefitTelemetry: null,
  recentVisits: [],
  notificationSettings: DEFAULT_NOTIFICATIONS,
  isRefreshingProfile: false,

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

  refreshProfileAndVisits: async () => {
    const { session, employee } = get();
    set({ isRefreshingProfile: true });
    try {
      const [profileRes, visitsRes] = await Promise.all([
        fetchEmployeeMe(session?.access_token, employee?.id),
        fetchEmployeeVisits(session?.access_token, employee?.id),
      ]);

      if (profileRes?.telemetry) {
        set({
          benefitTelemetry: profileRes.telemetry,
          employee: profileRes.employee || employee,
          organization: profileRes.organization || get().organization,
          benefit: profileRes.benefit || get().benefit,
        });
        await saveSecureItem(STORAGE_KEY_TELEMETRY, JSON.stringify(profileRes.telemetry));
        if (profileRes.employee) {
          await saveSecureItem(STORAGE_KEY_PROFILE, JSON.stringify(profileRes.employee));
        }
      }

      if (visitsRes && Array.isArray(visitsRes)) {
        set({ recentVisits: visitsRes });
        await saveSecureItem(STORAGE_KEY_VISITS, JSON.stringify(visitsRes));
      }
    } catch (err) {
      console.warn('[refreshProfileAndVisits] Offline or fetch failed:', err);
    } finally {
      set({ isRefreshingProfile: false });
    }
  },

  updateNotificationSettings: async (settings: Partial<EmployeeNotificationSettings>) => {
    const updated = { ...get().notificationSettings, ...settings };
    set({ notificationSettings: updated });
    await saveSecureItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
  },

  recordSuccessfulCheckIn: (visit: VerifiedVisitReceipt) => {
    const currentTelemetry = get().benefitTelemetry;
    const currentVisits = get().recentVisits;
    if (!currentTelemetry) {
      set({ recentVisits: [visit, ...currentVisits] });
      saveSecureItem(STORAGE_KEY_VISITS, JSON.stringify([visit, ...currentVisits])).catch(() => {});
      return;
    }

    const currentRem = typeof currentTelemetry.remainingVisits === 'number'
      ? Math.max(0, currentTelemetry.remainingVisits - 1)
      : currentTelemetry.remainingVisits;
    const maxVisits = typeof currentTelemetry.maxMonthlyVisits === 'number' ? currentTelemetry.maxMonthlyVisits : 12;
    const used = currentTelemetry.usedVisits + 1;
    const quotaPct = maxVisits > 0 ? Math.min(100, Math.round((used / maxVisits) * 100)) : currentTelemetry.quotaPercentage;

    const updatedTelemetry: BenefitUsageTelemetry = {
      ...currentTelemetry,
      usedVisits: used,
      remainingVisits: currentRem,
      quotaPercentage: quotaPct,
    };

    set({
      benefitTelemetry: updatedTelemetry,
      recentVisits: [visit, ...currentVisits],
    });

    saveSecureItem(STORAGE_KEY_TELEMETRY, JSON.stringify(updatedTelemetry)).catch(() => {});
    saveSecureItem(STORAGE_KEY_VISITS, JSON.stringify([visit, ...currentVisits])).catch(() => {});
  },

  loadDemoAccount: async (orgType: 'bk' | 'techcorp') => {
    set({ isLoading: true, error: null });
    const demos = createDemoAccounts();
    const demo = demos[orgType];
    set({
      email: demo.email,
      organization: demo.organization,
      benefit: demo.benefit,
      employee: demo.employee,
      benefitTelemetry: demo.benefitTelemetry,
      recentVisits: demo.recentVisits,
      session: demo.session,
      demoOtp: demo.demoOtp,
      step: 'otp',
      isLoading: false,
    });
  },

  initializeSession: async () => {
    try {
      const token = await getSecureItem(STORAGE_KEY_TOKEN);
      const isActivated = await getSecureItem(STORAGE_KEY_ACTIVATED);
      const seed = await getSecureItem(STORAGE_KEY_SEED);
      const rawProfile = await getSecureItem(STORAGE_KEY_PROFILE);
      const rawBenefit = await getSecureItem(STORAGE_KEY_BENEFIT);
      const rawOrg = await getSecureItem(STORAGE_KEY_ORG);
      const rawTelemetry = await getSecureItem(STORAGE_KEY_TELEMETRY);
      const rawVisits = await getSecureItem(STORAGE_KEY_VISITS);
      const rawNotifs = await getSecureItem(STORAGE_KEY_NOTIFICATIONS);

      if (token && isActivated === 'true' && rawProfile) {
        set({
          session: { access_token: token, token_type: 'bearer', expires_in: 86400 },
          employee: JSON.parse(rawProfile),
          benefit: rawBenefit ? JSON.parse(rawBenefit) : null,
          organization: rawOrg ? JSON.parse(rawOrg) : null,
          offlineTokenSeed: seed,
          isBenefitActivated: true,
          benefitTelemetry: rawTelemetry ? JSON.parse(rawTelemetry) : null,
          recentVisits: rawVisits ? JSON.parse(rawVisits) : [],
          notificationSettings: rawNotifs ? JSON.parse(rawNotifs) : DEFAULT_NOTIFICATIONS,
          step: 'completed',
        });

        // Background non-blocking sync with backend API
        get().refreshProfileAndVisits().catch(() => {});
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
    await deleteSecureItem(STORAGE_KEY_TELEMETRY);
    await deleteSecureItem(STORAGE_KEY_VISITS);
    await deleteSecureItem(STORAGE_KEY_NOTIFICATIONS);

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
      benefitTelemetry: null,
      recentVisits: [],
      notificationSettings: DEFAULT_NOTIFICATIONS,
      demoOtp: null,
      error: null,
    });
  },
}));
