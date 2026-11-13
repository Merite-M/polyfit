/**
 * PolyFit Corporate Employee App - Facility Card Component (PF-100)
 * Compliant with expo-native-ui, expo-animation, vercel-react-native-skills, and PolyFit Design System v1.0
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import {
  MapPin,
  Star,
  ShieldCheck,
  ChevronRight,
  Waves,
  Sparkles,
  Flame,
  Activity,
  Car,
  Lock,
  ShowerHead,
  Navigation,
  QrCode,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { DiscoveredFacility, ProviderCategory } from '@/types/discovery';
import { getFacilityOperatingStatus, formatCommuteEstimate } from '@/services/discovery-service';

interface FacilityCardProps {
  facility: DiscoveredFacility;
  onPress: (facility: DiscoveredFacility) => void;
  onQuickCheckIn?: (facility: DiscoveredFacility) => void;
  onOpenDirections?: (facility: DiscoveredFacility) => void;
}

// Category color token mapper
export function getCategoryColor(category: ProviderCategory): string {
  switch (category) {
    case 'gym':
      return '#3B82F6'; // Electric Blue
    case 'pool':
      return Palette.teal; // Kinetic Teal (#00D2B4)
    case 'studio':
      return '#8B5CF6'; // Vibrant Purple
    case 'wellness_center':
    case 'clinic':
      return '#F59E0B'; // Warm Amber
    case 'sports':
      return Palette.green; // PolyFit Green (#28D17C)
    default:
      return '#3B82F6';
  }
}

// Category human-readable label
export function getCategoryLabel(category: ProviderCategory): string {
  switch (category) {
    case 'gym':
      return 'Strength Training';
    case 'pool':
      return 'Swimming Pool';
    case 'studio':
      return 'Yoga & Pilates';
    case 'wellness_center':
      return 'Spa & Recovery';
    case 'clinic':
      return 'Physiotherapy';
    case 'sports':
      return 'Racket & Sports';
    default:
      return 'Wellness';
  }
}

// Amenity icon helper
function renderAmenityIcon(amenity: string, color: string = Palette.textMuted) {
  const a = amenity.toLowerCase();
  if (a.includes('pool')) return <Waves size={12} color={color} />;
  if (a.includes('shower')) return <ShowerHead size={12} color={color} />;
  if (a.includes('sauna') || a.includes('steam')) return <Flame size={12} color={color} />;
  if (a.includes('park')) return <Car size={12} color={color} />;
  if (a.includes('lock')) return <Lock size={12} color={color} />;
  if (a.includes('reformer') || a.includes('pilates') || a.includes('yoga')) return <Sparkles size={12} color={color} />;
  return <Activity size={12} color={color} />;
}

export const FacilityCard = memo(function FacilityCard({
  facility,
  onPress,
  onQuickCheckIn,
  onOpenDirections,
}: FacilityCardProps) {
  const categoryColor = getCategoryColor(facility.provider.category);
  const categoryLabel = getCategoryLabel(facility.provider.category);
  const operatingStatus = getFacilityOperatingStatus(facility.operating_hours);
  const isIncluded = facility.isIncludedInPlan !== false;
  const coverPhoto = facility.photos && facility.photos.length > 0
    ? facility.photos[0]
    : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80';

  const handleQuickCheckinAction = (e: any) => {
    e.stopPropagation();
    if (!isIncluded) {
      const msg = `Upgrade Required: ${facility.location_name} is excluded from your active corporate plan tier. Contact HR to upgrade your plan.`;
      Alert.alert('Upgrade Required', msg);
      return;
    }
    if (onQuickCheckIn) {
      onQuickCheckIn(facility);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(facility)}
    >
      {/* Cover Image with WebP & Overlay Badges */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: coverPhoto }}
          style={styles.coverImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />

        {/* Gradient Overlay for Top Badges */}
        <View style={styles.badgeOverlayTop}>
          {/* Category Pill */}
          <View style={[styles.categoryBadge, { borderColor: `${categoryColor}66` }]}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
          </View>

          {/* Plan Eligibility Badge */}
          {isIncluded ? (
            <View style={styles.planIncludedBadge}>
              <ShieldCheck size={11} color="#0B1F33" strokeWidth={2.5} />
              <Text style={styles.planIncludedText}>INCLUDED IN PLAN</Text>
            </View>
          ) : (
            <View style={styles.planUpgradeBadge}>
              <Lock size={11} color="#0B1F33" strokeWidth={2.5} />
              <Text style={styles.planUpgradeText}>EXCLUDED FROM PLAN</Text>
            </View>
          )}
        </View>

        {/* Bottom Distance & Rating Pill Overlay */}
        <View style={styles.badgeOverlayBottom}>
          <View style={styles.telemetryPill}>
            <MapPin size={11} color={Palette.teal} />
            <Text style={styles.telemetryText}>
              {formatCommuteEstimate(facility.distance_km)}
            </Text>
          </View>

          <View style={styles.ratingPill}>
            <Star size={11} color="#FFB800" fill="#FFB800" />
            <Text style={styles.ratingText}>
              {facility.provider.rating ? facility.provider.rating.toFixed(1) : '4.8'}
            </Text>
          </View>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.cardContent}>
        {/* Facility Title & Neighborhood */}
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.facilityName} numberOfLines={1}>
              {facility.location_name}
            </Text>
            <Text style={styles.neighborhoodText} numberOfLines={1}>
              {facility.neighborhood} • {facility.address}
            </Text>
          </View>
          <ChevronRight size={18} color={Palette.textMuted} />
        </View>

        {/* Amenities Chips */}
        <View style={styles.amenitiesRow}>
          {facility.amenities.slice(0, 4).map((amenity, idx) => (
            <View key={idx} style={styles.amenityChip}>
              {renderAmenityIcon(amenity, '#94A3B8')}
              <Text style={styles.amenityText}>
                {amenity.replace('_', ' ')}
              </Text>
            </View>
          ))}
          {facility.amenities.length > 4 && (
            <View style={styles.amenityMoreChip}>
              <Text style={styles.amenityMoreText}>+{facility.amenities.length - 4}</Text>
            </View>
          )}
        </View>

        {/* Footer: Live Operating Status & Quick Actions */}
        <View style={styles.cardFooter}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                operatingStatus.statusBadge === 'open' && styles.statusDotOpen,
                operatingStatus.statusBadge === 'closing_soon' && styles.statusDotClosing,
                operatingStatus.statusBadge === 'closed' && styles.statusDotClosed,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                operatingStatus.statusBadge === 'open' && styles.statusTextOpen,
                operatingStatus.statusBadge === 'closing_soon' && styles.statusTextClosing,
                operatingStatus.statusBadge === 'closed' && styles.statusTextClosed,
              ]}
            >
              {operatingStatus.statusText}
            </Text>
          </View>

          <View style={styles.cardQuickActionsGroup}>
            {onOpenDirections && (
              <Pressable
                style={styles.cardQuickRouteBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onOpenDirections(facility);
                }}
                hitSlop={6}
              >
                <Navigation size={12} color={Palette.teal} />
                <Text style={styles.cardQuickRouteText}>Route</Text>
              </Pressable>
            )}

            {onQuickCheckIn && (
              <Pressable
                style={[
                  styles.cardQuickCheckinBtn,
                  !isIncluded && styles.cardQuickCheckinBtnDisabled,
                ]}
                onPress={handleQuickCheckinAction}
                hitSlop={6}
              >
                {isIncluded ? (
                  <QrCode size={12} color="#0B1F33" />
                ) : (
                  <Lock size={12} color="#0B1F33" />
                )}
                <Text style={styles.cardQuickCheckinText}>
                  {isIncluded ? 'Check In' : 'Upgrade'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: Spacing.three,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px -2px rgba(11, 31, 51, 0.06), 0 2px 6px -1px rgba(11, 31, 51, 0.04)',
      },
      default: {
        shadowColor: '#0B1F33',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },

  imageWrapper: {
    width: '100%',
    height: 145,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  badgeOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(11, 31, 51, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  planIncludedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planIncludedText: {
    color: '#0B1F33',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  planUpgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planUpgradeText: {
    color: '#0B1F33',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  badgeOverlayBottom: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 21, 33, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  telemetryText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(7, 21, 33, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  cardContent: {
    padding: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleBlock: {
    flex: 1,
    marginRight: 8,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B1F33',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  neighborhoodText: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '500',
  },

  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amenityText: {
    fontSize: 11,
    color: '#475569',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  amenityMoreChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    justifyContent: 'center',
  },
  amenityMoreText: {
    fontSize: 10,
    color: Palette.textMuted,
    fontWeight: '600',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Palette.textMuted,
  },
  statusDotOpen: {
    backgroundColor: '#10B981',
  },
  statusDotClosing: {
    backgroundColor: '#F59E0B',
  },
  statusDotClosed: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '500',
    flexShrink: 1,
  },
  statusTextOpen: {
    color: '#065F46',
    fontWeight: '600',
  },
  statusTextClosing: {
    color: '#92400E',
    fontWeight: '600',
  },
  statusTextClosed: {
    color: '#991B1B',
  },
  cardQuickActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardQuickRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 210, 180, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.inner,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 180, 0.3)',
  },
  cardQuickRouteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007A68',
  },
  cardQuickCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.inner,
  },
  cardQuickCheckinBtnDisabled: {
    backgroundColor: '#F59E0B',
  },
  cardQuickCheckinText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0B1F33',
  },
});
