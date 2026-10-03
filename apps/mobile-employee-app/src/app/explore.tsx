/**
 * PolyFit Corporate Employee App - Tab 2: Wellness Provider Network Explorer
 * Compliant with expo-native-ui, expo-animation, and vercel-react-native-skills
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import {
  Search,
  MapPin,
  Dumbbell,
  Waves,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

interface ProviderFacility {
  id: string;
  name: string;
  category: 'gym' | 'pool' | 'studio' | 'physio';
  categoryLabel: string;
  neighborhood: string;
  distance: string;
  hours: string;
  rating: string;
  features: string[];
}

const SAMPLE_FACILITIES: ProviderFacility[] = [
  {
    id: 'fac-1',
    name: 'Kigali Heights Fitness Club',
    category: 'gym',
    categoryLabel: 'Gym & Weights',
    neighborhood: 'Kimihurura',
    distance: '0.6 km',
    hours: '05:30 - 22:00',
    rating: '4.9',
    features: ['Cardio', 'Olympic Barbells', 'Sauna'],
  },
  {
    id: 'fac-2',
    name: 'Cercle Sportif Olympic Pool',
    category: 'pool',
    categoryLabel: 'Swimming Pool',
    neighborhood: 'Kiyovu',
    distance: '1.2 km',
    hours: '06:00 - 20:00',
    rating: '4.8',
    features: ['50m Lap Pool', 'Diving', 'Coaching'],
  },
  {
    id: 'fac-3',
    name: 'Zen Wellness Studio',
    category: 'studio',
    categoryLabel: 'Yoga & Pilates',
    neighborhood: 'Nyarutarama',
    distance: '2.4 km',
    hours: '07:00 - 21:00',
    rating: '5.0',
    features: ['Reformer Pilates', 'Hot Yoga', 'Sound Bath'],
  },
  {
    id: 'fac-4',
    name: 'Waka Fitness & Performance',
    category: 'gym',
    categoryLabel: 'Gym & Crossfit',
    neighborhood: 'Downtown Kigali',
    distance: '1.8 km',
    hours: '06:00 - 22:00',
    rating: '4.7',
    features: ['HIIT Zone', 'Steam Room', 'Smoothie Bar'],
  },
];

export default function ExploreNetworkScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'gym' | 'pool' | 'studio'>('all');

  const filteredFacilities = SAMPLE_FACILITIES.filter((fac) => {
    const matchesFilter = selectedFilter === 'all' || fac.category === selectedFilter;
    const matchesQuery =
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Partner Network</Text>
        <Text style={styles.headerSub}>45+ verified facilities included in your corporate plan</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Search size={18} color={Palette.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search facilities or neighborhoods..."
          placeholderTextColor={Palette.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          outlineStyle="none"
        />
      </View>

      {/* Category Filter Pills */}
      <View style={styles.filtersRow}>
        {(['all', 'gym', 'pool', 'studio'] as const).map((filter) => {
          const labels = {
            all: 'All (45)',
            gym: 'Gyms (18)',
            pool: 'Pools (8)',
            studio: 'Studios (12)',
          };
          const isActive = selectedFilter === filter;
          return (
            <Pressable
              key={filter}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {labels[filter]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Facilities List */}
      <ScrollView
        contentContainerStyle={styles.facilityList}
        showsVerticalScrollIndicator={false}
      >
        {filteredFacilities.map((fac) => (
          <View key={fac.id} style={styles.facilityCard}>
            <View style={styles.cardHeader}>
              <View style={styles.nameBlock}>
                <Text style={styles.facilityName}>{fac.name}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={12} color={Palette.teal} />
                  <Text style={styles.locationText}>
                    {fac.neighborhood} • {fac.distance}
                  </Text>
                </View>
              </View>
              <View style={styles.instantAccessBadge}>
                <ShieldCheck size={12} color={Palette.green} />
                <Text style={styles.instantAccessText}>INCLUDED</Text>
              </View>
            </View>

            <View style={styles.featuresRow}>
              {fac.features.map((feat, idx) => (
                <View key={idx} style={styles.featurePill}>
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.hoursRow}>
                <Clock size={12} color={Palette.textMuted} />
                <Text style={styles.hoursText}>Open today: {fac.hours}</Text>
              </View>
              <Text style={styles.ratingText}>★ {fac.rating}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071521',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  topHeader: {
    marginBottom: Spacing.three,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2235',
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    marginBottom: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },

  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#0D2235',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(40, 209, 124, 0.15)',
    borderColor: Palette.green,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  filterChipTextActive: {
    color: Palette.green,
    fontWeight: '700',
  },

  facilityList: {
    gap: 12,
    paddingBottom: Spacing.eight,
  },
  facilityCard: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameBlock: {
    flex: 1,
  },
  facilityName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: Palette.teal,
  },
  instantAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  instantAccessText: {
    color: Palette.green,
    fontSize: 10,
    fontWeight: '800',
  },

  featuresRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  featurePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  featureText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '500',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursText: {
    fontSize: 11,
    color: Palette.textMuted,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFB800',
  },
});
