/**
 * PolyFit Corporate Employee App - Interactive Cross-Platform Map View (PF-100)
 * Native & Web compatible interactive cartography with category pins, GPS radar beacon,
 * neighborhood clusters, and slide-up facility preview cards.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import {
  MapPin,
  Crosshair,
  Plus,
  Minus,
  Star,
  ChevronRight,
  ShieldCheck,
  Dumbbell,
  Waves,
  Sparkles,
  Flame,
  Activity,
  Layers,
  Navigation,
  QrCode,
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

// Kigali geographic bounds for relative projection
const KIGALI_BOUNDS = {
  minLat: -1.975,
  maxLat: -1.925,
  minLng: 30.045,
  maxLng: 30.125,
};

// Neighborhood anchor labels for map orientation
const NEIGHBORHOOD_ANCHORS = [
  { name: 'Kiyovu', lat: -1.959, lng: 30.063 },
  { name: 'Kimihurura', lat: -1.954, lng: 30.088 },
  { name: 'Nyarutarama', lat: -1.936, lng: 30.102 },
  { name: 'Gishushu', lat: -1.951, lng: 30.093 },
  { name: 'Downtown', lat: -1.946, lng: 30.058 },
  { name: 'Remera', lat: -1.959, lng: 30.116 },
  { name: 'Kacyiru', lat: -1.938, lng: 30.081 },
];

export function InteractiveMapView({
  facilities,
  userLocation,
  onSelectFacility,
  selectedFacility,
}: InteractiveMapViewProps) {
  const { width } = useWindowDimensions();
  const mapWidth = Math.min(width, 600);
  const mapHeight = 440;

  const { navigateToPassWithFacility } = useTabStore();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });
  panOffsetRef.current = panOffset;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6,
        onPanResponderGrant: () => {
          panStartRef.current = { ...panOffsetRef.current };
        },
        onPanResponderMove: (_, gestureState) => {
          setPanOffset({
            x: panStartRef.current.x + gestureState.dx,
            y: panStartRef.current.y + gestureState.dy,
          });
        },
      }),
    []
  );

  const handleOpenDirections = (fac: DiscoveredFacility) => {
    if (!fac.lat || !fac.lng) {
      const query = encodeURIComponent(`${fac.location_name}, Kigali, Rwanda`);
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
    navigateToPassWithFacility(fac);
  };

  // Map latitude/longitude to X/Y pixel coordinates
  const projectCoords = (lat: number, lng: number) => {
    const latSpan = KIGALI_BOUNDS.maxLat - KIGALI_BOUNDS.minLat;
    const lngSpan = KIGALI_BOUNDS.maxLng - KIGALI_BOUNDS.minLng;

    // Normalization (0 to 1)
    const normX = (lng - KIGALI_BOUNDS.minLng) / lngSpan;
    const normY = (KIGALI_BOUNDS.maxLat - lat) / latSpan; // Invert Y because latitude goes north

    // Scaled coordinates with zoom and pan
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;

    const x = centerX + (normX * (mapWidth - 80) + 40 - centerX) * zoomLevel + panOffset.x;
    const y = centerY + (normY * (mapHeight - 80) + 40 - centerY) * zoomLevel + panOffset.y;

    return { x, y };
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.2, z + 0.3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.8, z - 0.3));
  const handleCenterUser = () => {
    setZoomLevel(1.2);
    setPanOffset({ x: 0, y: 0 });
  };

  // Render category icon
  const getCategoryPinIcon = (category: ProviderCategory) => {
    switch (category) {
      case 'gym':
        return <Dumbbell size={13} color="#FFFFFF" strokeWidth={2.5} />;
      case 'pool':
        return <Waves size={13} color="#0B1F33" strokeWidth={2.5} />;
      case 'studio':
        return <Sparkles size={13} color="#FFFFFF" strokeWidth={2.5} />;
      case 'wellness_center':
      case 'clinic':
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
        {...panResponder.panHandlers}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => onSelectFacility(null as any)}
        />
        {/* Cartographic Grid & Roads Background Graphic */}
        <View style={styles.gridOverlay}>
          {/* Main Boulevards Graphic */}
          <View style={styles.roadKN3} />
          <View style={styles.roadKG9} />
          <View style={styles.roadAirportRd} />
          <View style={styles.lakeWaterBody} />
        </View>

        {/* Neighborhood Ambient Labels */}
        {NEIGHBORHOOD_ANCHORS.map((anchor) => {
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

        {/* Provider Category Pins */}
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
              onPress={(e) => {
                e.stopPropagation();
                onSelectFacility(fac);
              }}
            >
              {isSelected && <View style={[styles.selectedPulseRing, { borderColor: pinColor }]} />}

              {/* Pin Teardrop Shape */}
              <View
                style={[
                  styles.pinMarker,
                  { backgroundColor: pinColor, borderColor: isSelected ? '#FFFFFF' : 'rgba(11, 31, 51, 0.8)' },
                ]}
              >
                {getCategoryPinIcon(fac.provider.category)}
              </View>
              <View style={[styles.pinPointer, { borderTopColor: pinColor }]} />
            </Pressable>
          );
        })}
      </View>

      {/* Floating Map Controls */}
      <View style={styles.controlsTopRow}>
        <View style={styles.countBadge}>
          <Layers size={13} color={Palette.green} />
          <Text style={styles.countBadgeText}>
            {facilities.length} Verified Facilities
          </Text>
        </View>

        <View style={styles.controlsGroup}>
          <Pressable style={styles.controlBtn} onPress={handleZoomIn}>
            <Plus size={16} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.controlBtn} onPress={handleZoomOut}>
            <Minus size={16} color="#FFFFFF" />
          </Pressable>
          <Pressable style={[styles.controlBtn, styles.controlBtnActive]} onPress={handleCenterUser}>
            <Crosshair size={16} color={Palette.green} />
          </Pressable>
        </View>
      </View>

      {/* Bottom Floating Facility Preview Slide Card */}
      {selectedFacility && (
        <View style={styles.previewCardContainer}>
          <Pressable
            style={styles.previewCard}
            onPress={() => onSelectFacility(selectedFacility)}
          >
            {/* Thumbnail */}
            <Image
              source={{
                uri: selectedFacility.photos[0] ||
                  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
              }}
              style={styles.previewImage}
              contentFit="cover"
              transition={150}
            />

            {/* Info */}
            <View style={styles.previewInfo}>
              <View style={styles.previewTopRow}>
                <View
                  style={[
                    styles.previewCategoryPill,
                    { backgroundColor: `${getCategoryColor(selectedFacility.provider.category)}22` },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewCategoryText,
                      { color: getCategoryColor(selectedFacility.provider.category) },
                    ]}
                  >
                    {getCategoryLabel(selectedFacility.provider.category)}
                  </Text>
                </View>

                {selectedFacility.isIncludedInPlan !== false ? (
                  <View style={styles.previewIncludedBadge}>
                    <ShieldCheck size={10} color="#0B1F33" strokeWidth={2.5} />
                    <Text style={styles.previewIncludedText}>INCLUDED</Text>
                  </View>
                ) : (
                  <View style={styles.previewUpgradeBadge}>
                    <Text style={styles.previewUpgradeText}>TIER 2</Text>
                  </View>
                )}
              </View>

              <Text style={styles.previewTitle} numberOfLines={1}>
                {selectedFacility.location_name}
              </Text>

              <View style={styles.previewBottomRow}>
                <View style={styles.previewDistanceRow}>
                  <MapPin size={11} color={Palette.teal} />
                  <Text style={styles.previewDistanceText}>
                    {selectedFacility.distance_km ? `${selectedFacility.distance_km} km` : selectedFacility.neighborhood}
                  </Text>
                </View>

                <View style={styles.previewRatingRow}>
                  <Star size={11} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.previewRatingText}>
                    {selectedFacility.provider.rating ? selectedFacility.provider.rating.toFixed(1) : '4.8'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions (Route & Check In) */}
            <View style={styles.previewActionsColumn}>
              <Pressable
                style={styles.previewRouteBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleOpenDirections(selectedFacility);
                }}
                hitSlop={6}
              >
                <Navigation size={12} color={Palette.teal} />
                <Text style={styles.previewRouteText}>Route</Text>
              </Pressable>

              <Pressable
                style={styles.previewCheckinBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleQuickCheckIn(selectedFacility);
                }}
                hitSlop={6}
              >
                <QrCode size={12} color="#0B1F33" />
                <Text style={styles.previewCheckinText}>Check In</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      )}
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
    top: '55%',
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

  // Neighborhood Anchor Labels
  anchorLabelWrapper: {
    position: 'absolute',
    width: 70,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  anchorLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.25)',
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
    boxShadow: '0 0 10px rgba(40, 209, 124, 0.8)',
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
    zIndex: 30,
    transform: [{ scale: 1.15 }],
  },
  selectedPulseRing: {
    position: 'absolute',
    top: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    opacity: 0.8,
  },
  pinMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
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

  // Floating Controls Top
  controlsTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 31, 51, 0.9)',
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
  controlsGroup: {
    flexDirection: 'column',
    gap: 6,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 31, 51, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  controlBtnActive: {
    borderColor: 'rgba(40, 209, 124, 0.4)',
    backgroundColor: '#0D2235',
  },

  // Floating Bottom Preview Slide Card
  previewCardContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 40,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1F33',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(40, 209, 124, 0.3)',
    padding: 10,
    gap: 10,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#071521',
  },
  previewInfo: {
    flex: 1,
    minWidth: 0,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 3,
  },
  previewCategoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewIncludedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.green,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewIncludedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0B1F33',
  },
  previewUpgradeBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewUpgradeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0B1F33',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  previewBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  previewDistanceText: {
    fontSize: 11,
    color: Palette.teal,
    fontWeight: '600',
  },
  previewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  previewRatingText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewActionsColumn: {
    justifyContent: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  previewRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#132D43',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.inner,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 180, 0.3)',
  },
  previewRouteText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.teal,
  },
  previewCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.green,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.inner,
  },
  previewCheckinText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0B1F33',
  },
});
