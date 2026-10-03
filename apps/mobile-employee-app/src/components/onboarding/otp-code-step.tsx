/**
 * PolyFit Corporate Employee App - Step 2: OTP Verification
 * PF-105: Frictionless Corporate Employee Onboarding & Benefit Activation
 * Compliant with expo-native-ui, expo-animation, and vercel-react-native-skills
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Palette, Radius, Spacing, Fonts } from '@/constants/theme';

export const OtpCodeStep: React.FC = () => {
  const {
    email,
    demoOtp,
    isLoading,
    error,
    setStep,
    submitVerifyAccess,
    submitRequestAccess,
  } = useAuthStore();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(45);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    const val = clean.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      submitVerifyAccess(fullCode);
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFillDemo = () => {
    const code = demoOtp || '123456';
    const split = code.split('').slice(0, 6);
    setDigits(split);
    submitVerifyAccess(code);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(45);
    await submitRequestAccess();
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <View style={styles.screenContainer}>
      {/* Top Header & Progress Stepper */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={() => setStep('welcome')}
        >
          <ArrowLeft size={18} color="#FFFFFF" />
        </Pressable>

        {/* Step Progress Pills (Step 2 of 3) */}
        <View style={styles.stepperContainer}>
          <View style={[styles.stepPill, styles.stepPillCompleted]} />
          <View style={[styles.stepPill, styles.stepPillActive]} />
          <View style={styles.stepPill} />
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentBody}>
        {/* Title & Subtitle */}
        <View style={styles.headerBlock}>
          <Text style={styles.screenTitle}>Enter verification code</Text>
          <Text style={styles.screenSubtitle}>
            We sent a 6-digit access code to{' '}
            <Text style={styles.highlightEmail}>{email || 'your corporate email'}</Text>.
          </Text>
        </View>

        {/* 6 Digit Input Boxes */}
        <View style={styles.otpRow}>
          {digits.map((digit, idx) => {
            const isFocused = inputRefs.current[idx]?.isFocused?.();
            const isFilled = digit.length > 0;
            return (
              <TextInput
                key={idx}
                ref={(ref) => {
                  inputRefs.current[idx] = ref;
                }}
                style={[
                  styles.otpBox,
                  isFilled && styles.otpBoxFilled,
                  isFocused && styles.otpBoxFocused,
                ]}
                value={digit}
                onChangeText={(text) => handleDigitChange(idx, text)}
                onKeyPress={(e) => handleKeyPress(idx, e)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
              />
            );
          })}
        </View>

        {/* Demo Auto-Fill Chip */}
        {demoOtp || __DEV__ ? (
          <Pressable
            style={({ pressed }) => [
              styles.demoChip,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleFillDemo}
          >
            <Sparkles size={14} color={Palette.green} />
            <Text style={styles.demoChipText}>
              Demo Code: <Text style={styles.demoCodeBold}>{demoOtp || '123456'}</Text> (Tap to auto-fill)
            </Text>
          </Pressable>
        ) : null}

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Bottom Pinned Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.resendRow}>
          <Pressable
            onPress={handleResend}
            disabled={resendCooldown > 0}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend verification code'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setStep('welcome')}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.changeEmailText}>Wrong email?</Text>
          </Pressable>
        </View>

        {/* Primary CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            (!isComplete || isLoading) && styles.continueButtonDisabled,
            pressed && isComplete && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => submitVerifyAccess(digits.join(''))}
          disabled={!isComplete || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0B1F33" />
          ) : (
            <View style={styles.continueButtonContent}>
              <Text style={styles.continueButtonText}>Verify & Unlock Benefit</Text>
              <ArrowRight size={18} color="#0B1F33" />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#071521',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepPill: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepPillCompleted: {
    backgroundColor: 'rgba(40, 209, 124, 0.4)',
    width: 20,
  },
  stepPillActive: {
    backgroundColor: Palette.green,
    width: 28,
  },

  contentBody: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.four,
  },
  headerBlock: {
    marginBottom: Spacing.five,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    color: Palette.textSecondary,
    lineHeight: 22,
  },
  highlightEmail: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.four,
  },
  otpBox: {
    width: 46,
    height: 56,
    minWidth: 0,
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    paddingHorizontal: 0,
    outlineStyle: 'none' as any,
  },
  otpBoxFilled: {
    borderColor: 'rgba(40, 209, 124, 0.5)',
    backgroundColor: '#112C42',
  },
  otpBoxFocused: {
    borderColor: Palette.green,
    boxShadow: '0 0 12px rgba(40, 209, 124, 0.25)',
  },

  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.3)',
    borderRadius: Radius.btn,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: Spacing.three,
  },
  demoChipText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  demoCodeBold: {
    color: Palette.green,
    fontWeight: '800',
    letterSpacing: 1,
  },

  errorBanner: {
    backgroundColor: 'rgba(255, 90, 101, 0.12)',
    borderRadius: Radius.sm,
    padding: 10,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#FF5A65',
    fontSize: 13,
    fontWeight: '500',
  },

  bottomBar: {
    gap: Spacing.three,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  resendText: {
    fontSize: 13,
    color: Palette.teal,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: Palette.textMuted,
  },
  changeEmailText: {
    fontSize: 13,
    color: Palette.textSecondary,
    textDecorationLine: 'underline',
  },

  continueButton: {
    height: 54,
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(40, 209, 124, 0.35)',
  },
  continueButtonDisabled: {
    opacity: 0.45,
    boxShadow: 'none',
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#0B1F33',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts?.sans,
  },
});
