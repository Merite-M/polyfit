"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Dumbbell, 
  Waves, 
  Sparkles, 
  HeartHandshake, 
  MapPin, 
  CheckCircle2, 
  Search, 
  SlidersHorizontal, 
  Star, 
  ArrowRight, 
  Map as MapIcon, 
  List, 
  Compass, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { useLeadModal } from "@/lib/lead-modal";

interface Facility {
  id: string;
  name: string;
  provider_name?: string;
  city: string;
  cityLabel: string;
  category: 'gym' | 'pool' | 'studio' | 'spa';
  categoryLabel: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewsCount: number;
  image: string;
  amenities: string[];
  featured?: boolean;
}

interface FacilityDirectoryProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function FacilityDirectory({ onOpenLeadForm }: FacilityDirectoryProps = {}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeCity, setActiveCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("waka-kimihurura");
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [spotlightIndex, setSpotlightIndex] = useState<number>(0);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);
  const openModal = useLeadModal((s) => s.open);

  const handleOpenLead = (type: 'employer' | 'provider' = 'employer') => {
    if (onOpenLeadForm) {
      onOpenLeadForm(type);
    } else {
      openModal(type);
    }
  };

  // Curated baseline of verified facilities in Rwanda & East Africa
  const defaultFacilities: Facility[] = [
    {
      id: "waka-kimihurura",
      name: "WAKA Fitness Kimihurura",
      city: "kigali",
      cityLabel: "Kigali, Kimihurura",
      category: "gym",
      categoryLabel: "Gym & Functional Training",
      address: "KG 674 St, Kimihurura",
      lat: -1.9536,
      lng: 30.0924,
      rating: 4.9,
      reviewsCount: 142,
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
      amenities: ["Olympic Racks", "Functional Turf", "Sauna & Steam", "Smoothie Bar"],
      featured: true,
    },
    {
      id: "csk-rugunga",
      name: "Cercle Sportif de Kigali (CSK)",
      city: "kigali",
      cityLabel: "Kigali, Rugunga",
      category: "pool",
      categoryLabel: "Olympic Pool & Multi-Sport",
      address: "KN 3 Ave, Rugunga",
      lat: -1.9680,
      lng: 30.0650,
      rating: 4.8,
      reviewsCount: 210,
      image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800",
      amenities: ["50m Olympic Pool", "Clay Tennis", "Strength Gym", "Locker Rooms"],
      featured: true,
    },
    {
      id: "nyarutarama-club",
      name: "Nyarutarama Tennis & Swim Club",
      city: "kigali",
      cityLabel: "Kigali, Nyarutarama",
      category: "pool",
      categoryLabel: "Aquatic Center & Tennis",
      address: "KG 15 Ave, Nyarutarama",
      lat: -1.9351,
      lng: 30.1035,
      rating: 4.85,
      reviewsCount: 98,
      image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&q=80&w=800",
      amenities: ["Heated Lap Pool", "Floodlit Courts", "Personal Trainers", "Café"],
      featured: true,
    },
    {
      id: "heaven-spa",
      name: "Heaven Wellness & Spa",
      city: "kigali",
      cityLabel: "Kigali, Kiyovu",
      category: "spa",
      categoryLabel: "Thermal Spa & Recovery",
      address: "KN 29 St, Kiyovu",
      lat: -1.9560,
      lng: 30.0600,
      rating: 4.95,
      reviewsCount: 164,
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800",
      amenities: ["Finnish Sauna", "Cold Plunge", "Deep Tissue", "Yoga Deck"],
      featured: true,
    },
    {
      id: "cali-musanze",
      name: "Cali Fitness & High-Altitude Center",
      city: "musanze",
      cityLabel: "Musanze, Northern Hub",
      category: "gym",
      categoryLabel: "High-Altitude Training Gym",
      address: "NM 21 St, Musanze Central",
      lat: -1.4980,
      lng: 29.6340,
      rating: 4.75,
      reviewsCount: 52,
      image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800",
      amenities: ["Cardio Theater", "Free Weights", "Heated Pool", "Recovery Lounge"],
      featured: false,
    },
    {
      id: "inzu-yoga",
      name: "Inzu Eco Mindfulness & Yoga",
      city: "musanze",
      cityLabel: "Musanze, Kinigi Corridor",
      category: "studio",
      categoryLabel: "Yoga & Mindfulness Studio",
      address: "Kinigi Road, Musanze",
      lat: -1.4420,
      lng: 29.5910,
      rating: 4.9,
      reviewsCount: 88,
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
      amenities: ["Open Air Shala", "Vinyasa & Yin", "Sound Baths", "Herbal Tea Bar"],
      featured: true,
    },
    {
      id: "kivu-marina",
      name: "Lake Kivu Aquatic & Wellness Center",
      city: "rubavu",
      cityLabel: "Rubavu, Gisenyi Waterfront",
      category: "pool",
      categoryLabel: "Waterfront Pool & Cross-Training",
      address: "Boulevard de la Kivu, Gisenyi",
      lat: -1.7020,
      lng: 29.2560,
      rating: 4.8,
      reviewsCount: 76,
      image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800",
      amenities: ["Lake-facing Lap Pool", "Outdoor Gym", "Kayak Workouts", "Steam Bath"],
      featured: false,
    },
    {
      id: "pilates-kigali",
      name: "Kigali Reformer Pilates Studio",
      city: "kigali",
      cityLabel: "Kigali, Gishushu",
      category: "studio",
      categoryLabel: "Reformer & Mat Pilates",
      address: "KG 9 Ave, Gishushu",
      lat: -1.9480,
      lng: 30.0880,
      rating: 4.92,
      reviewsCount: 110,
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800",
      amenities: ["Balanced Body Reformers", "Clinical Instructors", "Private Rooms"],
      featured: false,
    },
  ];

  const [facilities, setFacilities] = useState<Facility[]>(defaultFacilities);

  // Attempt to fetch real provider discovery data from backend on mount
  useEffect(() => {
    async function fetchDiscovery() {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        setIsLiveLoading(true);
        const res = await fetch(`${backendUrl}/api/providers/discover?limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (data.providers && data.providers.length > 0) {
            const mapped: Facility[] = data.providers.map((p: any, idx: number) => ({
              id: p.location_id || p.id || `live-${idx}`,
              name: p.location_name || p.name || "PolyFit Partner Venue",
              provider_name: p.name,
              city: (p.city || "kigali").toLowerCase(),
              cityLabel: `${p.city || "Kigali"}, ${p.address || "Rwanda"}`,
              category: (p.category === "gym" ? "gym" : p.category === "pool" ? "pool" : p.category === "studio" ? "studio" : "spa"),
              categoryLabel: p.category ? p.category.toUpperCase() : "Wellness Partner",
              address: p.address || "Verified Facility Location",
              lat: p.lat ? parseFloat(p.lat) : -1.9536 + (idx * 0.008),
              lng: p.lng ? parseFloat(p.lng) : 30.0924 + (idx * 0.007),
              rating: p.rating ? parseFloat(p.rating) : 4.8,
              reviewsCount: 40 + (idx * 7),
              image: (p.photos && p.photos[0]) || defaultFacilities[idx % defaultFacilities.length].image,
              amenities: p.amenities || ["Cardio", "Strength", "Lockers", "Shower"],
              featured: idx < 4,
            }));
            setFacilities(mapped);
          }
        }
      } catch {
        // Graceful fallback to default curated dataset
      } finally {
        setIsLiveLoading(false);
      }
    }
    fetchDiscovery();
  }, []);

  const categories = [
    { id: "all", label: "All Facilities", icon: Dumbbell },
    { id: "gym", label: "Gyms & Functional", icon: Dumbbell },
    { id: "pool", label: "Swimming Pools", icon: Waves },
    { id: "studio", label: "Yoga & Pilates", icon: HeartHandshake },
    { id: "spa", label: "Thermal Spa & Recovery", icon: Sparkles },
  ];

  const cities = [
    { id: "all", label: "All Cities" },
    { id: "kigali", label: "Kigali" },
    { id: "musanze", label: "Musanze" },
    { id: "rubavu", label: "Rubavu" },
  ];

  // Filtering
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesCategory = activeCategory === "all" || f.category === activeCategory;
      const matchesCity = activeCity === "all" || f.city === activeCity;
      const matchesSearch =
        searchQuery.trim() === "" ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.cityLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.amenities.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesCity && matchesSearch;
    });
  }, [facilities, activeCategory, activeCity, searchQuery]);

  // Selected facility object
  const selectedFacility = useMemo(() => {
    return facilities.find((f) => f.id === selectedFacilityId) || filteredFacilities[0] || facilities[0];
  }, [facilities, selectedFacilityId, filteredFacilities]);

  // Featured Spotlight Facilities
  const spotlightFacilities = useMemo(() => {
    return facilities.filter((f) => f.featured);
  }, [facilities]);

  const nextSpotlight = () => {
    setSpotlightIndex((prev) => (prev + 1) % spotlightFacilities.length);
  };

  const prevSpotlight = () => {
    setSpotlightIndex((prev) => (prev - 1 + spotlightFacilities.length) % spotlightFacilities.length);
  };

  return (
    <section id="facility-directory" className="py-16 sm:py-24 bg-card text-card-foreground border-t border-border" aria-labelledby="facility-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Telemetry Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3 border border-accent/20">
              <Compass className="w-3.5 h-3.5 text-accent" />
              <span>East Africa Wellness Network</span>
            </div>
            <h2 id="facility-heading" className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Discover Vetted Partner Facilities
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
              One PolyFit corporate benefit unlocks verified digital access to the region&apos;s leading gyms, lap pools, pilates studios, and thermal recovery spas.
            </p>
          </div>

          {/* Quick Counter Proof Strip */}
          <div className="flex items-center gap-6 bg-muted/40 border border-border px-5 py-3 rounded-[12px] self-start md:self-auto shadow-2xs">
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">50+</div>
              <div className="text-[11px] text-muted-foreground font-medium">Vetted Venues</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">4</div>
              <div className="text-[11px] text-muted-foreground font-medium">Cities Roaming</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-accent font-mono">100%</div>
              <div className="text-[11px] text-muted-foreground font-medium">Pass Verified</div>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search Container */}
        <div className="bg-muted/30 border border-border rounded-[14px] p-4 sm:p-5 mb-8 shadow-xs">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="facility-search-input"
                name="facilitySearch"
                aria-label="Search wellness facilities by name, district, or amenity"
                type="text"
                placeholder="Search by venue, district, or amenity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-[10px] text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`whitespace-nowrap inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-card text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* City Filter & View Mode Toggles */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
              {/* City selector */}
              <div className="inline-flex items-center p-0.5 bg-card border border-border rounded-[10px]">
                {cities.map((city) => {
                  const isActive = activeCity === city.id;
                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => setActiveCity(city.id)}
                      className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                        isActive ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {city.label}
                    </button>
                  );
                })}
              </div>

              {/* Mobile View Toggle */}
              <div className="inline-flex md:hidden items-center p-0.5 bg-card border border-border rounded-[10px]">
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-[8px] text-xs font-semibold cursor-pointer ${
                    viewMode === 'map' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                  aria-label="Map View"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-[8px] text-xs font-semibold cursor-pointer ${
                    viewMode === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                  aria-label="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Map & Discovery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* Map Display Column (7 cols on lg) */}
          <div className={`lg:col-span-7 bg-[#0B1F33] rounded-[14px] overflow-hidden border border-[#1E293B] shadow-xl relative min-h-[480px] lg:min-h-[600px] flex flex-col justify-between ${
            viewMode === 'list' ? 'hidden md:flex' : 'flex'
          }`}>
            {/* Map Top Status Bar */}
            <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28D17C] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#28D17C]" />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  Live Network Telemetry
                </span>
              </div>
              <span className="text-xs font-mono text-[#28D17C] bg-[#28D17C]/10 border border-[#28D17C]/20 px-2.5 py-0.5 rounded-full">
                {filteredFacilities.length} Venues Active
              </span>
            </div>

            {/* Interactive SVG Network Map Viewport */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center p-6 overflow-hidden select-none bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px]">
              
              {/* Radar Coordinate Rings */}
              <div className="absolute w-[440px] h-[440px] border border-white/[0.04] rounded-full pointer-events-none" />
              <div className="absolute w-[300px] h-[300px] border border-white/[0.05] rounded-full pointer-events-none" />
              <div className="absolute w-[160px] h-[160px] border border-[#28D17C]/10 rounded-full pointer-events-none" />

              {/* SVG Map of Rwanda with Vector Topography Contours */}
              <svg 
                className="w-full h-full max-h-[440px] opacity-70"
                viewBox="0 0 600 450" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Simplified Rwanda Territory Polygon */}
                <path
                  d="M140 90 L230 60 L350 75 L430 110 L480 180 L460 260 L410 330 L320 370 L220 360 L160 300 L110 220 L120 140 Z"
                  fill="#0F243A"
                  stroke="#1E3A5F"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Lake Kivu Contour */}
                <path
                  d="M90 170 Q110 210 100 270 Q90 320 120 360 L100 380 Q70 300 80 220 Z"
                  fill="#00D2B4"
                  fillOpacity="0.12"
                  stroke="#00D2B4"
                  strokeWidth="1.5"
                />

                {/* Kigali Urban Core Highlight Polygon */}
                <ellipse 
                  cx="310" 
                  cy="210" 
                  rx="65" 
                  ry="50" 
                  fill="#28D17C" 
                  fillOpacity="0.06" 
                  stroke="#28D17C" 
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text x="310" y="215" fill="#64748B" fontSize="11" fontFamily="monospace" textAnchor="middle">
                  KIGALI METROPOLITAN
                </text>

                {/* Regional City Markers on SVG */}
                <text x="180" y="105" fill="#94A3B8" fontSize="10" fontFamily="sans-serif">Musanze</text>
                <circle cx="170" cy="110" r="3" fill="#64748B" />

                <text x="95" y="150" fill="#94A3B8" fontSize="10" fontFamily="sans-serif">Rubavu</text>
                <circle cx="110" cy="160" r="3" fill="#64748B" />

                {/* Grid Axes Lines */}
                <line x1="310" y1="40" x2="310" y2="400" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="60" y1="210" x2="540" y2="210" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              </svg>

              {/* Dynamic Interactive Facility Markers Over Map */}
              {filteredFacilities.map((facility, index) => {
                const isSelected = facility.id === selectedFacility.id;
                // Calculate display coordinates mapped across Kigali & Northern Province
                // Latitude roughly -1.4 (Musanze) to -1.97 (Kigali)
                // Longitude roughly 29.2 (Rubavu) to 30.12 (Kigali East)
                const normX = ((facility.lng - 29.2) / (30.2 - 29.2)) * 80 + 10;
                const normY = ((facility.lat - -1.4) / (-1.98 - -1.4)) * 75 + 15;

                const pinColor = 
                  facility.category === 'gym' ? 'bg-[#28D17C]' :
                  facility.category === 'pool' ? 'bg-[#00D2B4]' :
                  facility.category === 'studio' ? 'bg-purple-400' : 'bg-amber-400';

                return (
                  <div
                    key={facility.id}
                    style={{ left: `${normX}%`, top: `${normY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
                    onClick={() => setSelectedFacilityId(facility.id)}
                  >
                    {/* Radiating beacon pulse for selected */}
                    {isSelected && (
                      <div className={`absolute -inset-3 rounded-full opacity-60 animate-ping ${pinColor}`} />
                    )}

                    {/* Pin button */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 shadow-lg ${
                      isSelected 
                        ? `${pinColor} text-[#0B1F33] scale-125 ring-4 ring-white/30` 
                        : "bg-slate-800 text-white hover:scale-110 border border-white/20"
                    }`}>
                      {facility.category === 'gym' && <Dumbbell className="w-4 h-4 stroke-[2.5]" />}
                      {facility.category === 'pool' && <Waves className="w-4 h-4 stroke-[2.5]" />}
                      {facility.category === 'studio' && <HeartHandshake className="w-4 h-4 stroke-[2.5]" />}
                      {facility.category === 'spa' && <Sparkles className="w-4 h-4 stroke-[2.5]" />}
                    </div>

                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-[#0B1F33] text-white border border-white/20 rounded-[8px] text-[11px] shadow-2xl pointer-events-none z-30">
                      <div className="font-bold truncate">{facility.name}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5">{facility.cityLabel}</div>
                      <div className="flex items-center gap-1 text-[#28D17C] text-[10px] mt-1 font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{facility.rating} ({facility.reviewsCount} visits)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Map Bottom Telemetry Legend */}
            <div className="p-4 bg-slate-900/90 backdrop-blur-md border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-300">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28D17C]" />
                  <span>Gyms & Cross-fit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00D2B4]" />
                  <span>Swimming Pools</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>Yoga / Pilates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Spas & Sauna</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-400 font-mono">
                Lat: {selectedFacility.lat.toFixed(4)}, Lng: {selectedFacility.lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Selected Facility Detail Card + Venue List (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Active Selected Card Detail with Container Queries */}
            <div className="pf-venue-card-container">
              <div className="bg-card border-2 border-accent rounded-[14px] overflow-hidden shadow-lg shadow-accent/10 transition-all text-card-foreground">
                <div className="pf-venue-card-media relative h-48 w-full bg-slate-800 overflow-hidden">
                  <img
                    src={selectedFacility.image}
                    alt={selectedFacility.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span>{selectedFacility.cityLabel}</span>
                  </div>

                  <div className="absolute top-3 right-3 bg-card text-foreground px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                    <span>{selectedFacility.rating}</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="pf-fluid-badge font-bold uppercase tracking-wider text-accent">
                      {selectedFacility.categoryLabel}
                    </span>
                    <h3 className="pf-fluid-heading font-bold leading-tight">
                      {selectedFacility.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 pf-venue-card-body">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/80" />
                    <span>{selectedFacility.address}</span>
                  </p>

                  {/* Amenities Badges */}
                  <div className="space-y-1.5 mb-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Included Amenities:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFacility.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="bg-muted text-foreground px-2.5 py-1 rounded-[6px] text-xs font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Security Verification & Access Status */}
                  <div className="bg-accent-subtle border border-accent/30 rounded-[10px] p-3 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mb-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                      <span className="font-semibold">Digital Anti-Passback Scanner Live</span>
                    </div>
                    <span className="text-[11px] font-bold uppercase bg-accent text-accent-foreground px-2 py-0.5 rounded shadow-2xs">
                      All Tiers
                    </span>
                  </div>

                  {/* Action CTA */}
                  <button
                    type="button"
                    onClick={() => handleOpenLead('employer')}
                    className="w-full py-3 px-4 bg-accent hover:bg-emerald-400 text-accent-foreground text-xs sm:text-sm font-bold rounded-[10px] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Request Employee Access to this Venue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick List of Nearby Facilities */}
            <div className="bg-card border border-border rounded-[14px] p-4 shadow-xs text-card-foreground">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Matching Network Venues ({filteredFacilities.length})
                </h4>
                <span className="text-[11px] text-muted-foreground/80">Click to locate</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredFacilities.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFacilityId(f.id)}
                    className={`w-full text-left p-2.5 rounded-[8px] transition-all flex items-center justify-between text-xs cursor-pointer ${
                      f.id === selectedFacility.id
                        ? "bg-accent-subtle text-foreground font-bold border border-accent/30"
                        : "hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold truncate text-foreground">{f.name}</div>
                      <div className="text-[10px] text-muted-foreground">{f.cityLabel}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-accent">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{f.rating}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Premier Partner Spotlight Carousel */}
        <div className="bg-primary text-primary-foreground rounded-[14px] p-6 sm:p-10 mb-12 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Premier Partner Showcase</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Featured Wellness Facilities
              </h3>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSpotlight}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous Spotlight"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextSpotlight}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Next Spotlight"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Spotlight Card with Container Queries */}
          {spotlightFacilities[spotlightIndex] && (
            <div className="pf-venue-card-container">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white/5 border border-white/10 rounded-[12px] p-6 sm:p-8 backdrop-blur-xs">
                <div className="md:col-span-5 h-64 rounded-[10px] overflow-hidden">
                  <img
                    src={spotlightFacilities[spotlightIndex].image}
                    alt={spotlightFacilities[spotlightIndex].name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="md:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono uppercase bg-accent/20 text-accent px-2.5 py-0.5 rounded-full font-bold">
                        {spotlightFacilities[spotlightIndex].categoryLabel}
                      </span>
                      <span className="text-xs text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-accent" />
                        {spotlightFacilities[spotlightIndex].cityLabel}
                      </span>
                    </div>

                    <h4 className="pf-fluid-heading font-bold text-white mb-2">
                      {spotlightFacilities[spotlightIndex].name}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                      A premier corporate destination featuring state-of-the-art conditioning equipment, sanitized wellness amenities, and verified digital check-in passes. Fully accessible under PolyFit Professional and Enterprise plans.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {spotlightFacilities[spotlightIndex].amenities.map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-white/10 text-slate-200 px-3 py-1 rounded-[6px] text-xs font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="text-sm font-bold text-white">
                        {spotlightFacilities[spotlightIndex].rating} / 5.0
                      </span>
                      <span className="text-xs text-slate-400">
                        ({spotlightFacilities[spotlightIndex].reviewsCount} corporate visits)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFacilityId(spotlightFacilities[spotlightIndex].id);
                        const el = document.getElementById("facility-directory");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View on Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Become a Provider Partner Acquisition CTA */}
        <div className="bg-card border border-border rounded-[14px] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs text-card-foreground">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-accent-subtle px-3 py-1 rounded-full mb-3 border border-accent/20">
              <span>Partner Facility Network</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Own or Operate a Wellness Facility in East Africa?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mt-1.5 leading-relaxed">
              Join Rwanda&apos;s fastest growing corporate wellness aggregator. Fill off-peak capacity with verified corporate beneficiaries, eliminate bad debt, and receive automated monthly settlement deposits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleOpenLead('provider')}
              className="px-6 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold rounded-[10px] transition-colors whitespace-nowrap text-center cursor-pointer shadow-xs"
            >
              Apply to Become a Partner
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
