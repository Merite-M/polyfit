import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Root Entry Route: Smart Auth-Aware Redirect
 * Automatically routes authenticated beneficiaries to Tab 1 (Pass)
 * and new/unverified corporate employees to Frictionless Onboarding.
 */
export default function Index() {
  const isBenefitActivated = useAuthStore((s) => s.isBenefitActivated);
  const session = useAuthStore((s) => s.session);

  if (isBenefitActivated && session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}
