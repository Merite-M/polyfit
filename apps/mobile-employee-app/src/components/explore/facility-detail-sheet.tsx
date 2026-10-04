/**
 * PolyFit Corporate Employee App - Facility Detail Modal Screen (PF-100)
 * Hero image carousel, weekly operating hours breakdown, amenities matrix,
 * native turn-by-turn directions intent, and 1-tap transition to Tab 1 Access Pass.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import {
  X,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  Navigation,
  QrCode,
  ChevronDown,
  ChevronUp,
  Waves,
  Flame,
  Car,
  Lock,
  ShowerHead,
  Sparkles,
  Users,
  CheckCircle,
  Activity,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { DiscoveredFacility, WeeklyOperatingHours } from '@/types/discovery';
import { getFacilityOperatingStatus } from '@/services/discovery-service';
import { getCategoryColor, getCategoryLabel } from './facility-card';
import { useTabStore } from '@/stores/tab-store';

interface FacilityDetailSheetProps {
  facility: DiscoveredFacility | null;
  visible: boolean;
  onClose: () => void;
}

const DAYS_ORDER: { key: keyof WeeklyOperatingHours; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export function FacilityDetailSheet({
  facility,
  visible,
  onClose,
}: FacilityDetailSheetProps) {
  const { navigateToPassWithFacility } = useTabStore();
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = Math.min(windowWidth, 420);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [hoursExpanded, setHoursExpanded] = useState(false);

  if (!facility) return null;

  const categoryColor = getCategoryColor(facility.provider.category);
  const categoryLabel = getCategoryLabel(facility.provider.category);
  const operatingStatus = getFacilityOperatingStatus(facility.operating_hours);
  const photos = facility.photos && facility.photos.length > 0
    ? facility.photos
    : ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80'];

  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  // 1. Open Turn-by-Turn Directions in Apple Maps or Google Maps
  const handleOpenDirections = () => {
    if (!facility.lat || !facility.lng) {
      const query = encodeURIComponent(`${facility.location_name}, Kigali, Rwanda`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      return;
    }

    const { lat, lng } = facility;
    const url =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${lat},${lng}&q=${encodeURIComponent(facility.location_name)}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  // 2. 1-Tap Bridge to Tab 1: Access Pass (PF-101)
  const handleCheckInHere = () => {
    // Fire haptic feedback on supported platforms
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }

    // Pass selected facility to global tab store and switch active tab to 'pass'
    navigateToPassWithFacility(facility);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Close Floating Button */}
          <Pressable style={styles.floatingCloseBtn} onPress={onClose}>
            <X size={18} color="#FFFFFF" />
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Image Gallery Carousel */}
            <View style={styles.carouselContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const w = e.nativeEvent.layoutMeasurement.width;
                  if (w > 0) {
                    setActivePhotoIndex(Math.round(x / w));
                  }
                }}
                scrollEventThrottle={16}
              >
                {photos.map((uri, idx) => (
                  <View key={idx} style={[styles.carouselSlide, { width: slideWidth }]}>
                    <Image
                      source={{ uri }}
                      style={styles.carouselImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Photo Indicator Badge */}
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>
                  {activePhotoIndex + 1} / {photos.length}
                </Text>
              </View>
            </View>

            {/* Header Body */}
            <View style={styles.bodyContent}>
              {/* Category & Plan Eligibility Row */}
              <View style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryTag,
                    { backgroundColor: `${categoryColor}22`, borderColor: `${categoryColor}55` },
                  ]}
                >
                  <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                  <Text style={[styles.categoryTagText, { color: categoryColor }]}>
                    {categoryLabel}
                  </Text>
                </View>

                {facility.isIncludedInPlan !== false ? (
                  <View style={styles.planBadge}>
                    <ShieldCheck size={12} color="#0B1F33" strokeWidth={2.5} />
                    <Text style={styles.planBadgeText}>INCLUDED IN YOUR PLAN</Text>
                  </View>
                ) : (
                  <View style={styles.upgradeBadge}>
                    <Text style={styles.upgradeBadgeText}>TIER 2 ONLY</Text>
                  </View>
                )}
              </View>

              {/* Facility Title & Neighborhood */}
              <Text style={styles.facilityTitle}>{facility.location_name}</Text>
              <View style={styles.addressRow}>
                <MapPin size={14} color={Palette.teal} />
                <Text style={styles.addressText}>
                  {facility.address}, {facility.neighborhood}
                </Text>
              </View>

              {/* Verified Partner Badge */}
              <View style={styles.verifiedPartnerCard}>
                <CheckCircle size={15} color={Palette.green} />
                <View style={styles.verifiedPartnerInfo}>
                  <Text style={styles.verifiedPartnerTitle}>
                    Verified PolyFit Partner Facility
                  </Text>
                  <Text style={styles.verifiedPartnerSub}>
                    High-speed NFC & Plaque TOTP scanner supported at front desk
                  </Text>
                </View>
              </View>

              {/* Quick Metrics Bar */}
              <View style={styles.metricsBar}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Distance</Text>
                  <Text style={styles.metricValue}>
                    {facility.distance_km ? `${facility.distance_km} km` : 'Near you'}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Rating</Text>
                  <View style={styles.metricRatingValue}>
                    <Star size={13} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.metricValue}>
                      {facility.provider.rating ? facility.provider.rating.toFixed(1) : '4.8'}
                    </Text>
                  </View>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Capacity</Text>
                  <View style={styles.metricRatingValue}>
                    <Users size={13} color={Palette.textMuted} />
                    <Text style={styles.metricValue}>
                      {facility.capacity || 100}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Operating Hours Accordion */}
              <View style={styles.sectionCard}>
                <Pressable
                  style={styles.accordionHeader}
                  onPress={() => setHoursExpanded(!hoursExpanded)}
                >
                  <View style={styles.accordionHeaderLeft}>
                    <Clock size={16} color={Palette.teal} />
                    <View>
                      <Text style={styles.accordionTitle}>Operating Hours</Text>
                      <Text
                        style={[
                          styles.accordionSubtitle,
                          operatingStatus.statusBadge === 'open' && styles.statusTextOpen,
                          operatingStatus.statusBadge === 'closing_soon' && styles.statusTextClosing,
                          operatingStatus.statusBadge === 'closed' && styles.statusTextClosed,
                        ]}
                      >
                        {operatingStatus.statusText}
                      </Text>
                    </View>
                  </View>
                  {hoursExpanded ? (
                    <ChevronUp size={18} color={Palette.textMuted} />
                  ) : (
                    <ChevronDown size={18} color={Palette.textMuted} />
                  )}
                </Pressable>

                {hoursExpanded && (
                  <View style={styles.weeklySchedule}>
                    {DAYS_ORDER.map((day, idx) => {
                      const dayHours = facility.operating_hours?.[day.key];
                      const isToday = idx === currentDayIndex;

                      return (
                        <View
                          key={day.key}
                          style={[
                            styles.dayRow,
                            isToday && styles.dayRowToday,
                          ]}
                        >
                          <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                            {day.label} {isToday && '(Today)'}
                          </Text>
                          <Text style={[styles.dayHours, isToday && styles.dayHoursToday]}>
                            {dayHours && dayHours.open && dayHours.close
                              ? `${dayHours.open} - ${dayHours.close}`
                              : '06:00 - 22:00'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Amenities Grid */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>Included Amenities & Features</Text>
                <View style={styles.amenitiesMatrix}>
                  {facility.amenities.map((amenity, idx) => {
                    const a = amenity.toLowerCase();
                    let IconComponent = Activity;
                    if (a.includes('pool')) IconComponent = Waves;
                    if (a.includes('shower')) IconComponent = ShowerHead;
                    if (a.includes('sauna') || a.includes('steam')) IconComponent = Flame;
                    if (a.includes('park')) IconComponent = Car;
                    if (a.includes('lock')) IconComponent = Lock;
                    if (a.includes('reformer') || a.includes('pilates') || a.includes('yoga')) IconComponent = Sparkles;

                    return (
                      <View key={idx} style={styles.amenityMatrixItem}>
                        <View style={styles.amenityMatrixIcon}>
                          <IconComponent size={16} color={Palette.teal} />
                        </View>
                        <Text style={styles.amenityMatrixLabel}>
                          {amenity.replace('_', ' ')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Floating Sticky Action Footer */}
          <View style={styles.floatingActionFooter}>
            {/* Directions Action */}
            <Pressable style={styles.directionsBtn} onPress={handleOpenDirections}>
              <Navigation size={16} color="#FFFFFF" />
              <Text style={styles.directionsBtnText}>Directions</Text>
            </Pressable>

            {/* Check In Here CTA -> Tab 1 Pass */}
            <Pressable style={styles.checkInCtaBtn} onPress={handleCheckInHere}>
              <QrCode size={18} color="#0B1F33" />
              <Text style={styles.checkInCtaText}>Check In Here</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#071521',
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    maxHeight: '92%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.7)',
  },
  floatingCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 50,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11, 31, 51, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  },

  scrollContent: {
    paddingBottom: 90, // Room for floating footer bar
  },

  carouselContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#0B1F33',
    position: 'relative',
  },
  carouselSlide: {
    height: 220,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(7, 21, 33, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  photoCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  bodyContent: {
    padding: Spacing.four,
    gap: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0B1F33',
    letterSpacing: 0.3,
  },
  upgradeBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upgradeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0B1F33',
  },

  facilityTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    color: Palette.textSecondary,
    flex: 1,
  },

  verifiedPartnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0D2235',
    padding: 12,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.25)',
  },
  verifiedPartnerInfo: {
    flex: 1,
  },
  verifiedPartnerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  verifiedPartnerSub: {
    fontSize: 11,
    color: Palette.textMuted,
  },

  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0B1F33',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricRatingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  sectionCard: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accordionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusTextOpen: {
    color: '#A7F3D0',
  },
  statusTextClosing: {
    color: '#FDE68A',
  },
  statusTextClosed: {
    color: '#FCA5A5',
  },

  weeklySchedule: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  dayRowToday: {
    backgroundColor: 'rgba(40, 209, 124, 0.1)',
  },
  dayLabel: {
    fontSize: 12,
    color: Palette.textMuted,
  },
  dayLabelToday: {
    color: Palette.green,
    fontWeight: '700',
  },
  dayHours: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  dayHoursToday: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  amenitiesMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityMatrixItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D2235',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minWidth: '45%',
    flex: 1,
  },
  amenityMatrixIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 210, 180, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityMatrixLabel: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
    textTransform: 'capitalize',
    flex: 1,
  },

  // Floating Action Footer
  floatingActionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 84 : 72,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 10,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#0B1F33',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
  },
  directionsBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.btn,
    backgroundColor: '#132D43',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directionsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkInCtaBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: Radius.btn,
    backgroundColor: Palette.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 14px rgba(40, 209, 124, 0.35)',
  },
  checkInCtaText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0B1F33', // Strictly Midnight Navy on Green!
    letterSpacing: 0.2,
  },
});
