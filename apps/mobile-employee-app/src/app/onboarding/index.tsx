/**
 * Corporate Employee Onboarding Screen (PF-105)
 * Frictionless Onboarding, Domain Recognition, OTP & Benefit Activation Funnel
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { Palette, MaxContentWidth, Spacing } from '@/constants/theme';
import { WelcomeDomainStep } from '@/components/onboarding/welcome-domain-step';
import { OtpCodeStep } from '@/components/onboarding/otp-code-step';
import { SubsidyShowcaseStep } from '@/components/onboarding/subsidy-showcase-step';
import { DeviceBindingStep } from '@/components/onboarding/device-binding-step';

export default function OnboardingScreen() {
  const router = useRouter();
  const { step, isBenefitActivated } = useAuthStore();

  useEffect(() => {
    if (isBenefitActivated && step === 'completed') {
      router.replace('/');
    }
  }, [isBenefitActivated, step, router]);

  const handleFinishOnboarding = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {step === 'welcome' && <WelcomeDomainStep />}
          {step === 'otp' && <OtpCodeStep />}
          {step === 'subsidy' && <SubsidyShowcaseStep />}
          {step === 'permissions' && <DeviceBindingStep onFinish={handleFinishOnboarding} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
  },
});
