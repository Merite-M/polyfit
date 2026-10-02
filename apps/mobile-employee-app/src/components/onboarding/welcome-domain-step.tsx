/**
 * Welcome & Domain Recognition Step (PF-105 Path A & Path B)
 * Real-time domain resolution in < 500ms with dynamic employer branding
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Palette, Radius, Spacing, Fonts, Shadows } from '@/constants/theme';
import { PolyFitBrandHeader } from './polyfit-brand-header';

export const WelcomeDomainStep: React.FC = () => {
  const {
    email,
    inviteCode,
    authMethod,
    organization,
    benefit,
    isLoading,
    error,
    setEmail,
    setInviteCode,
    setAuthMethod,
    resolveEmailDomain,
    resolveInviteToken,
    submitRequestAccess,
    loadDemoAccount,
  } = useAuthStore();

  const [inputEmail, setInputEmail] = useState(email);
  const [inputCode, setInputCode] = useState(inviteCode);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated fade & slide for recognized employer card
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (organization) {
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      cardAnim.setValue(0);
    }
  }, [organization]);

  // Debounced email domain resolution
  const handleEmailChange = (text: string) => {
    setInputEmail(text);
    setEmail(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.includes('@') && text.split('@')[1]?.length >= 3) {
      debounceTimer.current = setTimeout(() => {
        resolveEmailDomain(text);
      }, 350);
    }
  };

  const handleCodeChange = (text: string) => {
    const upper = text.toUpperCase();
    setInputCode(upper);
    setInviteCode(upper);

    if (upper.length >= 6) {
      resolveInviteToken(upper);
    }
  };

  const handleContinue = async () => {
    if (authMethod === 'email') {
      if (!organization) {
        const resolved = await resolveEmailDomain(inputEmail);
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

  return (
    <View style={styles.container}>
      <PolyFitBrandHeader />

      {/* Hero Welcome Message */}
      <View style={styles.heroTextContainer}>
        <Text style={styles.headline}>Activate Your Corporate Benefit</Text>
        <Text style={styles.subheadline}>
          PolyFit connects you to Kigali & East Africa’s premier fitness, swimming, and wellness network.
        </Text>
      </View>

      {/* Path Switcher (Dual Pathway A vs B) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, authMethod === 'email' && styles.tabButtonActive]}
          onPress={() => setAuthMethod('email')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, authMethod === 'email' && styles.tabTextActive]}>
            Work Email
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, authMethod === 'invite' && styles.tabButtonActive]}
          onPress={() => setAuthMethod('invite')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, authMethod === 'invite' && styles.tabTextActive]}>
            HR Invite Code
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Input Form */}
      <View style={styles.inputCard}>
        {authMethod === 'email' ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Corporate Work Email</Text>
            <View style={[styles.inputWrapper, organization && styles.inputWrapperSuccess]}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. jean.mugisha@bk.rw"
                placeholderTextColor={Palette.textMuted}
                value={inputEmail}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isLoading ? (
                <ActivityIndicator size="small" color={Palette.navy} style={styles.inputIcon} />
              ) : organization ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ Enrolled</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.hint}>
              Enter your corporate domain to automatically unlock your company subsidy.
            </Text>
          </View>
        ) : (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>HR Invite Token</Text>
            <View style={[styles.inputWrapper, organization && styles.inputWrapperSuccess]}>
              <TextInput
                style={[styles.textInput, styles.codeFont]}
                placeholder="e.g. BK-8821"
                placeholderTextColor={Palette.textMuted}
                value={inputCode}
                onChangeText={handleCodeChange}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={10}
              />
              {isLoading ? (
                <ActivityIndicator size="small" color={Palette.navy} style={styles.inputIcon} />
              ) : organization ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ Valid Token</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.hint}>
              6-character token provided by your company HR administrator.
            </Text>
          </View>
        )}

        {/* Dynamic Employer Recognition Card */}
        {organization ? (
          <Animated.View
            style={[
              styles.employerCard,
              {
                opacity: cardAnim,
                transform: [
                  {
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.employerHeader}>
              <View style={styles.employerIconCircle}>
                <Text style={styles.employerInitial}>{organization.name.charAt(0)}</Text>
              </View>
              <View style={styles.employerInfo}>
                <Text style={styles.employerWelcome}>Welcome team member!</Text>
                <Text style={styles.employerName}>{organization.name}</Text>
              </View>
            </View>

            <View style={styles.subsidyPill}>
              <Text style={styles.subsidyPillText}>
                {benefit?.is_fully_sponsored
                  ? '✨ 100% Employer Funded Benefit'
                  : `✨ ${benefit?.subsidy_percentage}% Corporate Subsidy`}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Error message */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.primaryButton, (!inputEmail && !inputCode) && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={isLoading || (!inputEmail && !inputCode)}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color={Palette.navy} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {organization ? 'Continue to Verification →' : 'Find My Company Benefit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Demo Corporate Profiles (for Exec Demos & Evaluations) */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>QUICK DEMO PROFILES</Text>
        <View style={styles.demoRow}>
          <TouchableOpacity
            style={styles.demoChip}
            onPress={() => loadDemoAccount('bk')}
            activeOpacity={0.7}
          >
            <Text style={styles.demoChipText}>Bank of Kigali (bk.rw)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.demoChip}
            onPress={() => loadDemoAccount('techcorp')}
            activeOpacity={0.7}
          >
            <Text style={styles.demoChipText}>TechCorp (techcorp.rw)</Text>
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
  heroTextContainer: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  headline: {
    fontFamily: Fonts?.sans,
    fontSize: 22,
    fontWeight: '700',
    color: Palette.navy,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  subheadline: {
    fontFamily: Fonts?.sans,
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 420,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ECEFF4',
    borderRadius: Radius.btn,
    padding: 3,
    marginBottom: Spacing.three,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.btn - 2,
  },
  tabButtonActive: {
    backgroundColor: Palette.card,
    ...Shadows.card,
  },
  tabText: {
    fontFamily: Fonts?.sans,
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  tabTextActive: {
    color: Palette.navy,
  },
  inputCard: {
    backgroundColor: Palette.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: Spacing.four,
    ...Shadows.card,
  },
  fieldGroup: {
    marginBottom: Spacing.three,
  },
  label: {
    fontFamily: Fonts?.sans,
    fontSize: 13,
    fontWeight: '600',
    color: Palette.navy,
    marginBottom: Spacing.one,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Palette.cardBorder,
    borderRadius: Radius.btn,
    backgroundColor: Palette.canvas,
    paddingHorizontal: Spacing.three,
  },
  inputWrapperSuccess: {
    borderColor: Palette.green,
    backgroundColor: '#FAFCFA',
  },
  textInput: {
    flex: 1,
    height: 48,
    fontFamily: Fonts?.sans,
    fontSize: 15,
    color: Palette.navy,
  },
  codeFont: {
    fontFamily: Fonts?.mono,
    letterSpacing: 2,
    fontWeight: '700',
  },
  inputIcon: {
    marginLeft: Spacing.two,
  },
  verifiedBadge: {
    backgroundColor: Palette.greenSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.greenBorder,
  },
  verifiedBadgeText: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.greenText,
  },
  hint: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 6,
  },
  employerCard: {
    backgroundColor: Palette.greenSubtle,
    borderRadius: Radius.inner,
    borderWidth: 1,
    borderColor: Palette.greenBorder,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  employerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  employerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  employerInitial: {
    fontFamily: Fonts?.sans,
    fontSize: 18,
    fontWeight: '800',
    color: Palette.green,
  },
  employerInfo: {
    flex: 1,
  },
  employerWelcome: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    color: Palette.greenText,
    fontWeight: '600',
  },
  employerName: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '700',
    color: Palette.navy,
  },
  subsidyPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  subsidyPillText: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.navy,
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
  },
  primaryButton: {
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: Fonts?.sans,
    fontSize: 15,
    fontWeight: '700',
    color: Palette.navy, // STRICT CONTRAST: NAVY ON GREEN
  },
  demoSection: {
    marginTop: Spacing.five,
    alignItems: 'center',
  },
  demoTitle: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.textMuted,
    marginBottom: Spacing.two,
  },
  demoRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  demoChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    ...Shadows.card,
  },
  demoChipText: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.navy,
  },
});
