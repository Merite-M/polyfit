/**
 * PolyFit Corporate Employee App - Beneficiary Identity Header (PF-102)
 * Compliant with Stitch Design System v1.0 and Apple HIG/Material standards
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User, ShieldCheck, Mail, Briefcase, Hash } from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { EmployeeProfile, CorporateOrganization } from '@/types/auth';

interface BeneficiaryHeaderProps {
  employee: EmployeeProfile | null;
  organization: CorporateOrganization | null;
}

export function BeneficiaryHeader({ employee, organization }: BeneficiaryHeaderProps) {
  const employeeName = employee?.full_name || 'Jean Mugisha';
  const employeeEmail = employee?.email || 'jean.mugisha@bk.rw';
  const department = employee?.department || 'Commercial Banking';
  const externalId = (employee as any)?.employee_id_external || 'BK-EMP-4091';
  const orgName = organization?.name || 'Bank of Kigali';

  // Initials for avatar
  const initials = employeeName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {/* Avatar with monogram */}
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{initials || 'JM'}</Text>
        </View>

        {/* Identity Details */}
        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1}>
            {employeeName}
          </Text>

          <View style={styles.infoRow}>
            <Mail size={12} color={Palette.textMuted} />
            <Text style={styles.emailText} numberOfLines={1}>
              {employeeEmail}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Briefcase size={12} color={Palette.teal} />
            <Text style={styles.deptText} numberOfLines={1}>
              {department}
            </Text>
          </View>
        </View>
      </View>

      {/* Organization Enrollment Badge & Employee ID */}
      <View style={styles.badgeRow}>
        <View style={styles.verifiedBadge}>
          <ShieldCheck size={13} color={Palette.green} />
          <Text style={styles.verifiedBadgeText}>
            {orgName.toUpperCase()} • ENROLLED
          </Text>
        </View>

        {externalId ? (
          <View style={styles.idChip}>
            <Hash size={11} color={Palette.textMuted} />
            <Text style={styles.idChipText}>{externalId}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(40, 209, 124, 0.4)',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.green,
    letterSpacing: -0.5,
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '400',
  },
  deptText: {
    fontSize: 11,
    color: Palette.teal,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.25)',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.green,
    letterSpacing: 0.5,
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D2235',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  idChipText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Palette.textMuted,
    fontWeight: '500',
  },
});
