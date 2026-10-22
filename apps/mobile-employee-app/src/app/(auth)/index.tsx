import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { WelcomeDomainStep } from '@/components/onboarding/welcome-domain-step';
import { OtpCodeStep } from '@/components/onboarding/otp-code-step';
import { SubsidyShowcaseStep } from '@/components/onboarding/subsidy-showcase-step';
import { DeviceBindingStep } from '@/components/onboarding/device-binding-step';

export default function AuthScreen() {
  const router = useRouter();
  const { step } = useAuthStore();

  const handleFinishOnboarding = () => {
    router.replace('/(tabs)' as any);
  };

  return (
    <View style={styles.container}>
      {step === 'welcome' && <WelcomeDomainStep />}
      {step === 'otp' && <OtpCodeStep />}
      {step === 'subsidy' && <SubsidyShowcaseStep />}
      {step === 'permissions' && <DeviceBindingStep onFinish={handleFinishOnboarding} />}
      {step === 'completed' && <SubsidyShowcaseStep />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071521',
  },
});
