/**
 * PolyFit Corporate Employee App - Recent Verified Activity (PF-102)
 * List of verified visits with facility icons, relative timestamps, and tap-for-receipt
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Clock,
  ShieldCheck,
  ChevronRight,
  Dumbbell,
  Waves,
  HeartPulse,
  Flame,
  Sparkles,
  QrCode,
  MapPin,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { VerifiedVisitReceipt } from '@/types/auth';

interface RecentVisitsListProps {
  visits: VerifiedVisitReceipt[];
  onSelectVisit: (visit: VerifiedVisitReceipt) => void;
  onOpenPass?: () => void;
}

const CATEGORY_ICON_MAP: Record<string, any> = {
  gym: Dumbbell,
  pool: Waves,
  studio: Flame,
  clinic: HeartPulse,
  wellness_center: Sparkles,
  sports: Dumbbell,
};

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) {
      const isYesterday = now.getDate() !== date.getDate();
      return isYesterday ? `Yesterday, ${timeStr}` : `Today, ${timeStr}`;
    }
    if (diffDays === 1) return `Yesterday, ${timeStr}`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export function RecentVisitsList({ visits, onSelectVisit, onOpenPass }: RecentVisitsListProps) {
  if (!visits || visits.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Clock size={15} color={Palette.teal} />
          <Text style={styles.headerTitle}>Recent Verified Activity</Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <QrCode size={26} color={Palette.green} />
          </View>
          <Text style={styles.emptyTitle}>No Visits Recorded Yet</Text>
          <Text style={styles.emptySub}>
            Your corporate pass is active and ready to use at any partner wellness facility in Kigali.
          </Text>

          {onOpenPass && (
            <Pressable
              style={({ pressed }) => [
                styles.openPassBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
              onPress={onOpenPass}
            >
              <QrCode size={16} color="#0B1F33" />
              <Text style={styles.openPassBtnText}>Open My Pass</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Clock size={15} color={Palette.teal} />
          <Text style={styles.headerTitle}>Recent Verified Activity</Text>
        </View>
        <Text style={styles.headerHint}>Tap for receipt</Text>
      </View>

      <View style={styles.list}>
        {visits.slice(0, 5).map((visit, index) => {
          const IconComp = CATEGORY_ICON_MAP[visit.category] || Dumbbell;
          const relativeTime = formatRelativeTime(visit.checkInAt);

          return (
            <Pressable
              key={visit.id || `visit_${index}`}
              style={({ pressed }) => [
                styles.visitItem,
                pressed && styles.visitItemPressed,
                index === visits.length - 1 && styles.visitItemLast,
              ]}
              onPress={() => onSelectVisit(visit)}
            >
              <View style={styles.iconCircle}>
                <IconComp size={16} color={Palette.green} />
              </View>

              <View style={styles.visitMeta}>
                <View style={styles.facilityTopRow}>
                  <Text style={styles.facilityName} numberOfLines={1}>
                    {visit.providerName}
                  </Text>
                  <View style={styles.verifiedTag}>
                    <ShieldCheck size={11} color={Palette.green} />
                    <Text style={styles.verifiedTagText}>VERIFIED</Text>
                  </View>
                </View>

                <View style={styles.facilitySubRow}>
                  <MapPin size={11} color={Palette.textMuted} />
                  <Text style={styles.locationName} numberOfLines={1}>
                    {visit.locationName || visit.address}
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.timeText}>{relativeTime}</Text>
                </View>
              </View>

              <ChevronRight size={15} color={Palette.textMuted} />
            </Pressable>
          );
        })}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerHint: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.teal,
  },
  list: {
    backgroundColor: '#0D2235',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  visitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  visitItemLast: {
    borderBottomWidth: 0,
  },
  visitItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.25)',
  },
  visitMeta: {
    flex: 1,
    gap: 3,
  },
  facilityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  facilityName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.green,
    letterSpacing: 0.5,
  },
  facilitySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationName: {
    fontSize: 11,
    color: '#94A3B8',
    maxWidth: 130,
  },
  dot: {
    fontSize: 10,
    color: Palette.textMuted,
  },
  timeText: {
    fontSize: 11,
    color: Palette.textMuted,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.25)',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: Palette.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.two,
  },
  openPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.green,
    borderRadius: Radius.btn,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  openPassBtnText: {
    color: '#0B1F33',
    fontWeight: '700',
    fontSize: 12,
  },
});
