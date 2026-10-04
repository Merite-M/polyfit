/**
 * PolyFit Corporate Employee App - Help & Support Modal (PF-102)
 * WhatsApp first enterprise concierge, corporate email support, and benefit FAQs
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, ScrollView } from 'react-native';
import { AppModal } from '@/components/common/app-modal';
import {
  MessageSquare,
  Mail,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { BenefitPolicyFaq } from '@/types/auth';

interface SupportModalProps {
  visible: boolean;
  employeeName?: string;
  organizationName?: string;
  onClose: () => void;
}

const BENEFIT_FAQS: BenefitPolicyFaq[] = [
  {
    question: 'When does my monthly visit quota reset?',
    answer:
      'Your monthly visit allowance automatically resets at 12:00 AM on the 1st of every calendar month. Unused visits do not roll over to the next month.',
  },
  {
    question: 'Can I bring a guest or colleague with my pass?',
    answer:
      'Corporate wellness passes are individualized to your corporate identity and employee ID. Each visit pass covers entry for one verified employee.',
  },
  {
    question: 'What if I have zero cellular data or Wi-Fi in the facility?',
    answer:
      'PolyFit has a 100% offline cryptographic pass vault built-in. Your dynamic pass rotates and displays offline even in deep basements. When your phone reconnects, visit data synchronizes automatically.',
  },
  {
    question: 'What do I do if a facility desk has questions about my pass?',
    answer:
      'Show your dynamic QR code or pass receipt. Every partner facility in our network has a PolyFit scanner terminal. For immediate entrance support, tap the WhatsApp Concierge button above.',
  },
];

export function SupportModal({
  visible,
  employeeName = 'Jean Mugisha',
  organizationName = 'Bank of Kigali',
  onClose,
}: SupportModalProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi PolyFit Support, I am ${employeeName} from ${organizationName}. I need assistance with my corporate wellness benefit pass.`
    );
    // Standard Rwandan enterprise support line for PolyFit
    const url = `https://wa.me/250788000000?text=${text}`;
    Linking.openURL(url).catch(() => {});
  };

  const openEmail = () => {
    const subject = encodeURIComponent(`Corporate Benefit Support - ${organizationName}`);
    const body = encodeURIComponent(
      `Hello PolyFit Support,\n\nName: ${employeeName}\nCompany: ${organizationName}\n\nInquiry details:`
    );
    Linking.openURL(`mailto:support@polyfit.africa?subject=${subject}&body=${body}`).catch(() => {});
  };

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <HelpCircle size={18} color={Palette.teal} />
              <Text style={styles.headerTitle}>Help & Corporate Concierge</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
              hitSlop={8}
            >
              <X size={18} color={Palette.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Quick Contact Action Buttons */}
            <View style={styles.actionsRow}>
              {/* WhatsApp Concierge */}
              <Pressable
                style={({ pressed }) => [
                  styles.supportActionBtn,
                  styles.whatsappBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                onPress={openWhatsApp}
              >
                <MessageSquare size={16} color="#0B1F33" />
                <View style={styles.btnTextCol}>
                  <Text style={styles.whatsappBtnTitle}>WhatsApp Concierge</Text>
                  <Text style={styles.whatsappBtnSub}>Instant facility check-in help</Text>
                </View>
                <ExternalLink size={13} color="#0B1F33" />
              </Pressable>

              {/* Email Support */}
              <Pressable
                style={({ pressed }) => [
                  styles.supportActionBtn,
                  styles.emailBtn,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={openEmail}
              >
                <Mail size={16} color={Palette.teal} />
                <View style={styles.btnTextCol}>
                  <Text style={styles.emailBtnTitle}>Email Support</Text>
                  <Text style={styles.emailBtnSub}>support@polyfit.africa</Text>
                </View>
                <ExternalLink size={13} color={Palette.textMuted} />
              </Pressable>
            </View>

            {/* Corporate Benefit FAQs */}
            <View style={styles.faqSection}>
              <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>

              <View style={styles.faqList}>
                {BENEFIT_FAQS.map((faq, index) => {
                  const isExpanded = expandedFaq === index;
                  return (
                    <View key={`faq_${index}`} style={styles.faqItem}>
                      <Pressable
                        style={styles.faqQuestionRow}
                        onPress={() => setExpandedFaq(isExpanded ? null : index)}
                      >
                        <Text style={styles.faqQuestionText}>{faq.question}</Text>
                        {isExpanded ? (
                          <ChevronUp size={16} color={Palette.teal} />
                        ) : (
                          <ChevronDown size={16} color={Palette.textMuted} />
                        )}
                      </Pressable>

                      {isExpanded && (
                        <View style={styles.faqAnswerBox}>
                          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* SLA Reassurance */}
            <View style={styles.slaCard}>
              <Shield size={14} color={Palette.green} />
              <Text style={styles.slaText}>
                PolyFit Concierge operates 6:00 AM – 10:00 PM CAT daily across Rwanda to ensure seamless partner facility entry.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Done CTA */}
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>Close Help</Text>
          </Pressable>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 33, 0.85)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#0B1F33',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.6)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D2235',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  actionsRow: {
    gap: 10,
  },
  supportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    gap: 12,
  },
  whatsappBtn: {
    backgroundColor: Palette.green,
  },
  whatsappBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B1F33',
  },
  whatsappBtnSub: {
    fontSize: 11,
    color: '#0B1F33',
    opacity: 0.85,
  },
  emailBtn: {
    backgroundColor: '#0D2235',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emailBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emailBtnSub: {
    fontSize: 11,
    color: Palette.textMuted,
  },
  btnTextCol: {
    flex: 1,
  },
  faqSection: {
    gap: 10,
    marginTop: 4,
  },
  faqSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  faqQuestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  faqAnswerBox: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 8,
  },
  faqAnswerText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  slaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(40, 209, 124, 0.06)',
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.15)',
  },
  slaText: {
    fontSize: 10,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 14,
  },
  doneBtn: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.btn,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
