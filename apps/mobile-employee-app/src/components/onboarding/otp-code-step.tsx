/**
 * OTP / Magic Link Verification Step (PF-105 Step 1.4)
 * High-contrast 6-digit PIN input with auto-paste, resend timer, and instant validation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Palette, Radius, Spacing, Fonts, Shadows } from '@/constants/theme';
import { PolyFitBrandHeader } from './polyfit-brand-header';

export const OtpCodeStep: React.FC = () => {
  const {
    email,
    organization,
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
    // Focus first input box on mount
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, text: string) => {
    const val = text.slice(-1); // only keep last typed character
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);

    // Auto-advance to next box if digit entered
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are filled
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
    <View style={styles.container}>
      <PolyFitBrandHeader compact />

      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We dispatched a 6-digit access code to{' '}
            <Text style={styles.highlightEmail}>{email}</Text>
          </Text>
        </View>

        {/* 6-Digit OTP Boxes */}
        <View style={styles.otpRow}>
          {digits.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => {
                inputRefs.current[idx] = ref;
              }}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                inputRefs.current[idx]?.isFocused?.() ? styles.otpBoxFocused : null,
              ]}
              value={digit}
              onChangeText={(text) => handleDigitChange(idx, text)}
              onKeyPress={(e) => handleKeyPress(idx, e)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
            />
          ))}
        </View>

        {/* Demo Helper Pill */}
        {demoOtp || __DEV__ ? (
          <TouchableOpacity style={styles.demoPill} onPress={handleFillDemo} activeOpacity={0.8}>
            <Text style={styles.demoPillText}>
              ⚡ Demo Access Code: <Text style={styles.demoCodeBold}>{demoOtp || '123456'}</Text> (Tap to Auto-fill)
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Error message */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.verifyButton, (!isComplete || isLoading) && styles.verifyButtonDisabled]}
          onPress={() => submitVerifyAccess(digits.join(''))}
          disabled={!isComplete || isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color={Palette.navy} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Unlock Benefit →</Text>
          )}
        </TouchableOpacity>

        {/* Resend & Change Email Footer */}
        <View style={styles.footerRow}>
          <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0} activeOpacity={0.7}>
            <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep('welcome')} activeOpacity={0.7}>
            <Text style={styles.changeEmailText}>Use different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: Spacing.four,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: Spacing.four,
    ...Shadows.card,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    fontFamily: Fonts?.sans,
    fontSize: 20,
    fontWeight: '700',
    color: Palette.navy,
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontFamily: Fonts?.sans,
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  highlightEmail: {
    fontWeight: '700',
    color: Palette.navy,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: Spacing.four,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: Palette.cardBorder,
    borderRadius: Radius.btn,
    backgroundColor: Palette.canvas,
    fontFamily: Fonts?.mono,
    fontSize: 22,
    fontWeight: '700',
    color: Palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: Palette.navy,
    backgroundColor: '#FFFFFF',
  },
  otpBoxFocused: {
    borderColor: Palette.green,
    backgroundColor: '#FFFFFF',
  },
  demoPill: {
    backgroundColor: Palette.greenSubtle,
    borderWidth: 1,
    borderColor: Palette.greenBorder,
    borderRadius: Radius.inner,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  demoPillText: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.greenText,
  },
  demoCodeBold: {
    fontWeight: '800',
    fontFamily: Fonts?.mono,
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: Palette.errorBg,
    borderRadius: Radius.inner,
    borderWidth: 1,
    borderColor: Palette.errorBorder,
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    color: Palette.errorText,
    fontWeight: '500',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontFamily: Fonts?.sans,
    fontSize: 15,
    fontWeight: '700',
    color: Palette.navy,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F7',
  },
  resendText: {
    fontFamily: Fonts?.sans,
    fontSize: 13,
    fontWeight: '600',
    color: Palette.navy,
  },
  resendTextDisabled: {
    color: Palette.textMuted,
  },
  changeEmailText: {
    fontFamily: Fonts?.sans,
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
    textDecorationLine: 'underline',
  },
});
