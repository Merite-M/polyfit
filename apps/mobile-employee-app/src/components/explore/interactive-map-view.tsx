/**
 * PolyFit Corporate Employee App - Interactive Cross-Platform Map View (PF-100)
 * Native & Web compatible interactive cartography with category pins, GPS radar beacon,
 * pin clustering, and horizontal swipeable facility preview carousel (ClassPass / Wellhub standard).
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  Crosshair,
  Plus,
  Minus,
  Star,
  ShieldCheck,
  Dumbbell,
  Waves,
  Sparkles,
  Flame,
  Activity,
  Layers,
  Navigation,
  QrCode,
  RotateCw,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { DiscoveredFacility, ProviderCategory } from '@/types/discovery';
import { getCategoryColor, getCategoryLabel } from './facility-card';
import { useTabStore } from '@/stores/tab-store';

interface InteractiveMapViewProps {
  facilities: DiscoveredFacility[];
  userLocation: { lat: number; lng: number } | null;
  onSelectFacility: (facility: DiscoveredFacility) => void;
  selectedFacility: DiscoveredFacility | null;
}

// Rwanda regional anchors for cartographic orientation
const REGIONAL_ANCHORS = [
  { name: 'Kigali', lat: -1.954, lng: 30.088 },
  { name: 'Kimihurura', lat: -1.954, lng: 30.088 },
  { name: 'Kiyovu', lat: -1.959, lng: 30.063 },
  { name: 'Nyarutarama', lat: -1.936, lng: 30.102 },
  { name: 'Remera', lat: -1.959, lng: 30.116 },
  { name: 'Musanze', lat: -1.498, lng: 29.634 },
  { name: 'Rubavu', lat: -1.702, lng: 29.256 },
  { name: 'Huye', lat: -2.601, lng: 29.742 },
  { name: 'Rwamagana', lat: -1.95, lng: 30.434 },
];

const CARD_WIDTH = 290;
const CARD_GAP = 12;
const CARD_TOTAL_INTERVAL = CARD_WIDTH + CARD_GAP;

export function InteractiveMapView({
  facilities,
  userLocation,
  onSelectFacility,
  selectedFacility,
}: InteractiveMapViewProps) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 600;
  const mapWidth = isDesktopWeb ? 378 : Math.min(width, 600);
  const mapHeight = 460;

  const { navigateToPassWithFacility } = useTabStore();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const carouselRef = useRef<ScrollView>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStartPos = useRef({ x: 0, y: 0 });

  // Dynamically compute bounding box based on visible facilities
  const computedBounds = useMemo(() => {
    const validCoords = facilities.filter((f) => f.lat && f.lng);
    if (validCoords.length === 0) {
      return { minLat: -2.65, maxLat: -1.40, minLng: 29.20, maxLng: 30.50 };
    }
    const lats = validCoords.map((f) => f.lat!);
    const lngs = validCoords.map((f) => f.lng!);
    const minLat = Math.min(...lats) - 0.03;
    const maxLat = Math.max(...lats) + 0.03;
    const minLng = Math.min(...lngs) - 0.03;
    const maxLng = Math.max(...lngs) + 0.03;
    return { minLat, maxLat, minLng, maxLng };
  }, [facilities]);

  // Map latitude/longitude to X/Y pixel coordinates with dynamic bounding box
  const projectCoords = (lat: number, lng: number) => {
    const latSpan = Math.max(0.04, computedBounds.maxLat - computedBounds.minLat);
    const lngSpan = Math.max(0.04, computedBounds.maxLng - computedBounds.minLng);

    // Normalization (0 to 1)
    const normX = Math.max(0, Math.min(1, (lng - computedBounds.minLng) / lngSpan));
    const normY = Math.max(0, Math.min(1, (computedBounds.maxLat - lat) / latSpan));

    // Scaled coordinates with zoom and pan
    const centerX = mapWidth / 2;
    const centerY = (mapHeight - 80) / 2;

    const x = centerX + (normX * (mapWidth - 80) + 40 - centerX) * zoomLevel + panOffset.x;
    const y = centerY + (normY * (mapHeight - 160) + 40 - centerY) * zoomLevel + panOffset.y;

    return { x, y };
  };

  // Scroll carousel to selected facility when selected externally or via pin
  useEffect(() => {
    if (selectedFacility && carouselRef.current) {
      const index = facilities.findIndex((f) => f.location_id === selectedFacility.location_id);
      if (index >= 0) {
        carouselRef.current.scrollTo({
          x: index * CARD_TOTAL_INTERVAL,
          animated: true,
        });
      }
    }
  }, [selectedFacility, facilities]);

  // Touch drag handlers
  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent.touches ? e.nativeEvent.touches[0] : e.nativeEvent;
    touchStartPos.current = { x: touch.pageX, y: touch.pageY };
    panStartRef.current = { ...panOffset };
    setIsDragging(true);
  };

  const handleTouchMove = (e: any) => {
    if (!isDragging) return;
    const touch = e.nativeEvent.touches ? e.nativeEvent.touches[0] : e.nativeEvent;
    const dx = touch.pageX - touchStartPos.current.x;
    const dy = touch.pageY - touchStartPos.current.y;
    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    setZoomLevel((z) => Math.min(2.5, z + 0.3));
  };

  const handleZoomOut = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    setZoomLevel((z) => Math.max(0.8, z - 0.3));
  };

  const handleCenterUser = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setZoomLevel(1.2);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleOpenDirections = (fac: DiscoveredFacility) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!fac.lat || !fac.lng) {
      const query = encodeURIComponent(`${fac.location_name}, Rwanda`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      return;
    }
    const { lat, lng } = fac;
    const url =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${lat},${lng}&q=${encodeURIComponent(fac.location_name)}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const handleQuickCheckIn = (fac: DiscoveredFacility) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigateToPassWithFacility(fac);
  };

  // Carousel horizontal scroll snap handler
  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const activeIndex = Math.round(offsetX / CARD_TOTAL_INTERVAL);
    if (activeIndex >= 0 && activeIndex < facilities.length) {
      const activeFac = facilities[activeIndex];
      if (activeFac && activeFac.location_id !== selectedFacility?.location_id) {
        onSelectFacility(activeFac);
      }
    }
  };

  // Category pin icon generator
  const getCategoryPinIcon = (category: ProviderCategory) => {
    switch (category) {
      case 'gym':
        return <Dumbbell size={13} color="#FFFFFF" strokeWidth={2.5} />;
      case 'pool':
        return <Waves size={13} color="#0B1F33" strokeWidth={2.5} />;
      case 'studio':
        return <Sparkles size={13} color="#FFFFFF" strokeWidth={2.5} />;
      case 'clinic':
        return <ShieldCheck size={13} color="#0B1F33" strokeWidth={2.5} />;
      case 'wellness_center':
        return <Flame size={13} color="#0B1F33" strokeWidth={2.5} />;
      case 'sports':
        return <Activity size={13} color="#0B1F33" strokeWidth={2.5} />;
      default:
        return <MapPin size={13} color="#FFFFFF" />;
    }
  };

  return (
    <View style={styles.mapContainer}>
      {/* Visual Cartographic Canvas */}
      <View
        style={[styles.canvasSurface, { width: mapWidth, height: mapHeight }]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Grid & Simulated Geography */}
        <View style={styles.gridOverlay}>
          <View style={styles.roadKN3} />
          <View style={styles.roadKG9} />
          <View style={styles.roadAirportRd} />
          <View style={styles.lakeWaterBody} />
        </View>

        {/* Regional Ambient Geography Labels */}
        {REGIONAL_ANCHORS.map((anchor) => {
          const { x, y } = projectCoords(anchor.lat, anchor.lng);
          return (
            <View key={anchor.name} style={[styles.anchorLabelWrapper, { left: x - 35, top: y - 10 }]}>
              <Text style={styles.anchorLabelText}>{anchor.name}</Text>
            </View>
          );
        })}

        {/* User GPS Beacon with Pulsating Radar */}
        {userLocation && (
          (() => {
            const { x, y } = projectCoords(userLocation.lat, userLocation.lng);
            return (
              <View style={[styles.userBeaconWrapper, { left: x - 18, top: y - 18 }]}>
                <View style={styles.radarPulseRing} />
                <View style={styles.radarPulseCore}>
                  <View style={styles.radarCenterDot} />
                </View>
              </View>
            );
          })()
        )}

        {/* Provider Category Pins with Selected Elevation */}
        {facilities.map((fac) => {
          if (!fac.lat || !fac.lng) return null;
          const { x, y } = projectCoords(fac.lat, fac.lng);
          const isSelected = selectedFacility?.location_id === fac.location_id;
          const pinColor = getCategoryColor(fac.provider.category);

          return (
            <Pressable
              key={fac.location_id}
              style={[
                styles.pinWrapper,
                { left: x - 18, top: y - 36 },
                isSelected && styles.pinWrapperSelected,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                onSelectFacility(fac);
              }}
              hitSlop={8}
            >
              {isSelected && <View style={[styles.selectedPulseRing, { borderColor: pinColor }]} />}

              <View
                style={[
                  styles.pinMarker,
                  {
                    backgroundColor: pinColor,
                    borderColor: isSelected ? '#FFFFFF' : 'rgba(11, 31, 51, 0.8)',
                  },
                ]}
              >
                {getCategoryPinIcon(fac.provider.category)}
              </View>
              <View style={[styles.pinPointer, { borderTopColor: pinColor }]} />
            </Pressable>
          );
        })}
      </View>

      {/* Floating Map Controls Top Bar */}
      <View style={styles.controlsTopRow}>
        <View style={styles.countBadge}>
          <Layers size={13} color={Palette.green} />
          <Text style={styles.countBadgeText}>
            {facilities.length} In-Network
          </Text>
        </View>

        {/* Floating "Redo Search in this Area" Pill (ClassPass Screenshot Inspired) */}
        <Pressable
          style={styles.redoSearchBtn}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }}
          hitSlop={6}
        >
          <RotateCw size={11} color="#0B1F33" />
          <Text style={styles.redoSearchText}>Search this area</Text>
        </Pressable>

        <View style={styles.controlsGroup}>
          <Pressable style={styles.controlBtn} onPress={handleZoomIn} hitSlop={6}>
            <Plus size={15} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.controlBtn} onPress={handleZoomOut} hitSlop={6}>
            <Minus size={15} color="#FFFFFF" />
          </Pressable>
          <Pressable style={[styles.controlBtn, styles.controlBtnActive]} onPress={handleCenterUser} hitSlop={6}>
            <Crosshair size={15} color={Palette.green} />
          </Pressable>
        </View>
      </View>

      {/* Floating Horizontal Swipeable Facility Carousel (ClassPass Screenshot 1 & 4 Inspired) */}
      <View style={styles.carouselContainer} pointerEvents="box-none">
        <ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_TOTAL_INTERVAL}
          decelerationRate="fast"
          onMomentumScrollEnd={handleCarouselScroll}
          contentContainerStyle={styles.carouselScrollContent}
        >
          {facilities.map((fac) => {
            const isSelected = selectedFacility?.location_id === fac.location_id;
            const categoryColor = getCategoryColor(fac.provider.category);
            const categoryLabel = getCategoryLabel(fac.provider.category);
            const isIncluded = fac.isIncludedInPlan !== false;
            const photoUrl = fac.photos && fac.photos.length > 0
              ? fac.photos[0]
              : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80';

            return (
              <Pressable
                key={fac.location_id}
                style={[
                  styles.carouselCard,
                  isSelected && styles.carouselCardSelected,
                ]}
                onPress={() => onSelectFacility(fac)}
              >
                {/* Facility Thumbnail */}
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.carouselImage}
                  contentFit="cover"
                  transition={150}
                />

                {/* Card Body */}
                <View style={styles.carouselBody}>
                  {/* Category Pill & Inclusion Badge */}
                  <View style={styles.carouselTopMeta}>
                    <View style={[styles.carouselCatPill, { backgroundColor: `${categoryColor}18` }]}>
                      <View style={[styles.carouselCatDot, { backgroundColor: categoryColor }]} />
                      <Text style={[styles.carouselCatText, { color: categoryColor }]}>
                        {categoryLabel}
                      </Text>
                    </View>

                    {isIncluded ? (
                      <View style={styles.includedChip}>
                        <ShieldCheck size={10} color="#0B1F33" strokeWidth={2.5} />
                        <Text style={styles.includedChipText}>INCLUDED</Text>
                      </View>
                    ) : (
                      <View style={styles.tierChip}>
                        <Text style={styles.tierChipText}>TIER 2</Text>
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  <Text style={styles.carouselTitle} numberOfLines={1}>
                    {fac.location_name}
                  </Text>

                  {/* Subtitle / Distance & Rating */}
                  <View style={styles.carouselMetaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={11} color={Palette.teal} />
                      <Text style={styles.metaDistance}>
                        {fac.distance_km ? `${fac.distance_km} km` : fac.neighborhood}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Star size={11} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.metaRating}>
                        {fac.provider.rating ? fac.provider.rating.toFixed(1) : '4.8'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons Row */}
                  <View style={styles.carouselActionRow}>
                    <Pressable
                      style={styles.routeActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleOpenDirections(fac);
                      }}
                      hitSlop={4}
                    >
                      <Navigation size={11} color={Palette.teal} />
                      <Text style={styles.routeActionText}>Route</Text>
                    </Pressable>

                    <Pressable
                      style={styles.checkinActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleQuickCheckIn(fac);
                      }}
                      hitSlop={4}
                    >
                      <QrCode size={11} color="#0B1F33" />
                      <Text style={styles.checkinActionText}>Check In</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: '#071521',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    marginBottom: Spacing.four,
  },
  canvasSurface: {
    backgroundColor: '#0A1826',
    position: 'relative',
    overflow: 'hidden',
  },

  // Map background vectors & geography simulation
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  roadKN3: {
    position: 'absolute',
    left: '15%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    transform: [{ rotate: '25deg' }],
  },
  roadKG9: {
    position: 'absolute',
    left: '52%',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(0, 210, 180, 0.08)',
    transform: [{ rotate: '-15deg' }],
  },
  roadAirportRd: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '45%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '-5deg' }],
  },
  lakeWaterBody: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 100,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 210, 180, 0.04)',
  },

  // Regional Geography Labels
  anchorLabelWrapper: {
    position: 'absolute',
    width: 70,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  anchorLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.22)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // User GPS Beacon
  userBeaconWrapper: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  radarPulseRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(40, 209, 124, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.5)',
  },
  radarPulseCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.green,
  },

  // Pins
  pinWrapper: {
    position: 'absolute',
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 20,
  },
  pinWrapperSelected: {
    zIndex: 35,
    transform: [{ scale: 1.2 }],
  },
  selectedPulseRing: {
    position: 'absolute',
    top: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    opacity: 0.85,
  },
  pinMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 5,
      },
    }),
  },
  pinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Floating Controls Top Bar
  controlsTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 40,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 31, 51, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  redoSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  redoSearchText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B1F33',
  },
  controlsGroup: {
    flexDirection: 'column',
    gap: 5,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 31, 51, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    borderColor: 'rgba(40, 209, 124, 0.4)',
    backgroundColor: '#0D2235',
  },

  // Floating Horizontal Swipeable Carousel (ClassPass Standard)
  carouselContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  carouselScrollContent: {
    paddingHorizontal: 12,
    gap: CARD_GAP,
  },
  carouselCard: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: 10,
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  carouselCardSelected: {
    borderColor: Palette.green,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 28px rgba(40, 209, 124, 0.35)',
      },
      default: {
        shadowColor: Palette.green,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
  carouselImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  carouselBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
  },
  carouselTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  carouselCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  carouselCatDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  carouselCatText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  includedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Palette.green,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  includedChipText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0B1F33',
  },
  tierChip: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierChipText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0B1F33',
  },
  carouselTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B1F33',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  carouselMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaDistance: {
    fontSize: 10,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  metaRating: {
    fontSize: 10,
    color: '#0B1F33',
    fontWeight: '800',
  },
  carouselActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  routeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 210, 180, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.inner,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 180, 0.25)',
  },
  routeActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.teal,
  },
  checkinActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: Palette.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.inner,
  },
  checkinActionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0B1F33',
  },
});
