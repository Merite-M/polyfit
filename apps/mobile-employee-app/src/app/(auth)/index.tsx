import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { WelcomeDomainStep } from '@/components/onboarding/welcome-domain-step';
import { OtpCodeStep } from '@/components/onboarding/otp-code-step';
import { SubsidyShowcaseStep } from '@/components/onboarding/subsidy-showcase-step';
import { DeviceBindingStep } from '@/components/onboarding/device-binding-step';

export default function OnboardingScreen() {
  const router = useRouter();
  const { step, isBenefitActivated } = useAuthStore();

  useEffect(() => {
    if (isBenefitActivated && step === 'completed') {
      router.replace('/index');
    }
  }, [isBenefitActivated, step, router]);

  const handleFinishOnboarding = () => {
    router.replace('/index');
  };

  return (
    <View style={styles.container}>
      {step === 'welcome' && <WelcomeDomainStep />}
      {step === 'otp' && <OtpCodeStep />}
      {step === 'subsidy' && <SubsidyShowcaseStep />}
      {step === 'permissions' && <DeviceBindingStep onFinish={handleFinishOnboarding} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071521',
  },
});
