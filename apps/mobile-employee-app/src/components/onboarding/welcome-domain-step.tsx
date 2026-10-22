/**
 * PolyFit Corporate Employee App - Step 1: Welcome & Omnichannel Recognition
 * PF-105: Frictionless Corporate Employee Onboarding & Benefit Activation
 * Powered by Expo 57: expo-haptics, expo-image, reanimated spring physics
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { Mail, Phone, KeyRound, Building2, Check, Sparkles, ArrowRight, UserCheck } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Palette, Radius, Spacing, Fonts } from '@/constants/theme';
import { PolyFitLogo } from '@/components/common/polyfit-logo';

export const WelcomeDomainStep: React.FC = () => {
  const {
    identifier,
    email,
    phone,
    authIdentifierType,
    inviteCode,
    authMethod,
    organization,
    benefit,
    employee,
    isLoading,
    error,
    setIdentifier,
    setInviteCode,
    setAuthMethod,
    resolveIdentity,
    resolveInviteToken,
    submitRequestAccess,
  } = useAuthStore();

  const [inputVal, setInputVal] = useState(identifier || email || phone || '');
  const [inputCode, setInputCode] = useState(inviteCode);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated slide & scale for employer recognition card
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (organization) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      cardScale.setValue(0.95);
      cardOpacity.setValue(0);
    }
  }, [organization]);

  const handleInputChange = (text: string) => {
    setInputVal(text);
    setIdentifier(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const clean = text.trim();
    const isEmail = clean.includes('@') && clean.split('@')[1]?.includes('.');
    const isPhone = !clean.includes('@') && clean.replace(/[^0-9]/g, '').length >= 8;

    if (isEmail || isPhone) {
      debounceTimer.current = setTimeout(() => {
        resolveIdentity(clean);
      }, 350);
    }
  };

  const handleCodeChange = (text: string) => {
    const clean = text.trim().toUpperCase();
    setInputCode(clean);
    setInviteCode(clean);
    if (clean.length >= 6) {
      resolveInviteToken(clean);
    }
  };

  const handleContinue = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    if (authMethod === 'email') {
      if (!organization) {
        const resolved = await resolveIdentity(inputVal);
        if (!resolved) return;
      }
      await submitRequestAccess();
    } else {
      if (!organization) {
        const resolved = await resolveInviteToken(inputCode);
        if (!resolved) return;
      }
      await submitRequestAccess();
    }
  };

  const isEmailMode = authMethod === 'email';
  const hasValue = isEmailMode ? inputVal.trim().length > 0 : inputCode.trim().length > 0;
  const isPhoneInput = isEmailMode && !inputVal.includes('@') && inputVal.replace(/[^0-9]/g, '').length >= 3;

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header & Progress Stepper */}
        <View style={styles.topBar}>
          <PolyFitLogo size={32} showWordmark theme="dark" />

          {/* Step Progress Pills */}
          <View style={styles.stepperContainer}>
            <View style={[styles.stepPill, styles.stepPillActive]} />
            <View style={styles.stepPill} />
            <View style={styles.stepPill} />
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentBody}>
          {/* Title & Microcopy */}
          <View style={styles.headerBlock}>
            <Text style={styles.screenTitle}>
              {isEmailMode ? 'Enter your work email or phone' : 'Enter Staff ID or Code'}
            </Text>
            <Text style={styles.screenSubtitle}>
              {isEmailMode
                ? "We'll instantly match your company's subsidized corporate wellness benefit."
                : 'Enter the Staff ID from your employee badge (e.g. BK-8821) or web activation code.'}
            </Text>
          </View>

          {/* Input Card Container */}
          <View style={styles.inputCard}>
            <View style={styles.inputWrapper}>
              {isEmailMode ? (
                isPhoneInput ? (
                  <Phone size={20} color={organization ? Palette.green : Palette.textMuted} />
                ) : (
                  <Mail size={20} color={organization ? Palette.green : Palette.textMuted} />
                )
              ) : (
                <KeyRound size={20} color={organization ? Palette.green : Palette.textMuted} />
              )}

              <TextInput
                style={styles.textInput}
                placeholder={isEmailMode ? 'e.g. claire@bk.rw or +250 788 123 456' : 'e.g. BK-8821 or 6-digit code'}
                placeholderTextColor={Palette.textMuted}
                value={isEmailMode ? inputVal : inputCode}
                onChangeText={isEmailMode ? handleInputChange : handleCodeChange}
                autoCapitalize={isEmailMode ? 'none' : 'characters'}
                autoCorrect={false}
                keyboardType={isEmailMode ? (isPhoneInput ? 'phone-pad' : 'email-address') : 'default'}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />

              {organization && (
                <View style={styles.verifiedBadge}>
                  <Check size={14} color={Palette.green} />
                  <Text style={styles.verifiedText}>Enrolled</Text>
                </View>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Employer Recognized Card (Springs into view with Expo Image) */}
            {organization && (
              <Animated.View
                style={[
                  styles.recognizedEmployerCard,
                  {
                    opacity: cardOpacity,
                    transform: [{ scale: cardScale }],
                  },
                ]}
              >
                {organization.logo_url ? (
                  <ExpoImage
                    source={{ uri: organization.logo_url }}
                    style={styles.employerLogoImage}
                    contentFit="contain"
                    transition={200}
                  />
                ) : (
                  <View style={styles.employerIconBadge}>
                    <Building2 size={20} color={Palette.green} />
                  </View>
                )}

                <View style={styles.employerDetails}>
                  <Text style={styles.employerName}>
                    {employee?.full_name ? `${employee.full_name} (${organization.name})` : organization.name}
                  </Text>
                  <View style={styles.subsidyRow}>
                    <Sparkles size={12} color={Palette.teal} />
                    <Text style={styles.subsidyHighlight}>
                      {benefit?.is_fully_sponsored
                        ? '100% Employer Funded Benefit'
                        : `${benefit?.subsidy_percentage}% Corporate Subsidy`}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Pathway Switcher Text Link */}
          <Pressable
            style={styles.switchPathwayButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.selectionAsync().catch(() => {});
              }
              const nextMode = isEmailMode ? 'invite' : 'email';
              setAuthMethod(nextMode);
            }}
          >
            <Text style={styles.switchPathwayText}>
              {isEmailMode
                ? 'Have a Staff ID or Activation Code instead? →'
                : 'Use work email or mobile number instead →'}
            </Text>
          </Pressable>
        </View>

        {/* Bottom Pinned Action Bar */}
        <View style={styles.bottomBar}>
          {/* Primary Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              !hasValue && styles.continueButtonDisabled,
              pressed && hasValue && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleContinue}
            disabled={isLoading || !hasValue}
          >
            {isLoading ? (
              <ActivityIndicator color="#0B1F33" />
            ) : (
              <View style={styles.continueButtonContent}>
                <Text style={styles.continueButtonText}>
                  {organization ? 'Continue to Verification' : 'Check My Benefit'}
                </Text>
                <ArrowRight size={18} color="#0B1F33" />
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#071521',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#0B1F33',
    fontWeight: '900',
    fontSize: 16,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
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

  inputCard: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071521',
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: Spacing.three,
    height: 56,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Fonts?.sans,
    outlineStyle: 'none' as any,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: Palette.green,
    fontSize: 11,
    fontWeight: '700',
  },

  errorBanner: {
    backgroundColor: 'rgba(255, 90, 101, 0.12)',
    borderRadius: Radius.sm,
    padding: 8,
  },
  errorBannerText: {
    color: '#FF5A65',
    fontSize: 12,
    fontWeight: '500',
  },

  recognizedEmployerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#132D43',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.3)',
    marginTop: 4,
  },
  employerLogoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  employerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  employerDetails: {
    flex: 1,
  },
  employerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subsidyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subsidyHighlight: {
    fontSize: 12,
    color: Palette.teal,
    fontWeight: '600',
  },

  switchPathwayButton: {
    alignSelf: 'center',
    paddingVertical: 14,
    marginTop: Spacing.two,
  },
  switchPathwayText: {
    fontSize: 13,
    color: Palette.teal,
    fontWeight: '600',
  },

  bottomBar: {
    gap: Spacing.three,
  },
  demoPresetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textMuted,
    letterSpacing: 0.5,
  },
  demoChip: {
    backgroundColor: '#0D2235',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  demoChipText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },

  continueButton: {
    height: 54,
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(40, 209, 124, 0.35)',
      },
      default: {
        shadowColor: Palette.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 7,
        elevation: 6,
      },
    }),
  },
  continueButtonDisabled: {
    opacity: 0.45,
    ...Platform.select({
      web: {
        boxShadow: 'none',
      },
      default: {
        elevation: 0,
        shadowOpacity: 0,
      },
    }),
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
