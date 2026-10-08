"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  MapPin, 
  Layers, 
  Filter, 
  ExternalLink, 
  Compass, 
  CheckCircle,
  Building,
  Dumbbell,
  Waves,
  Sparkles,
  Info
} from "lucide-react";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";
import { apiFetch } from "@/lib/api-client";

interface ProviderLocationPin {
  id: string;
  name: string;
  city: string;
  address?: string;
  lat: number | null;
  lng: number | null;
  status: string;
  provider: {
    id: string;
    name: string;
    category: string;
    status: string;
    email?: string;
  };
}

interface LocationsApiResponse {
  success: boolean;
  count: number;
  locations: ProviderLocationPin[];
}

export function NetworkCoverageMap() {
  const [selectedRegion, setSelectedRegion] = useState<"kigali" | "musanze" | "nairobi">("kigali");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [locations, setLocations] = useState<ProviderLocationPin[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ProviderLocationPin | null>(null);
  const [loading, setLoading] = useState(true);

  const { openDrawer } = useOperationsDrawer();

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        const data = await apiFetch<LocationsApiResponse>("/api/operations/locations");
        if (data && data.locations) {
          setLocations(data.locations);
        }
      } catch (err) {
        console.warn("[NetworkCoverageMap] Error loading locations:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, []);

  // Filter locations by region and category
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // Region filter
      if (selectedRegion === "kigali" && (loc.city?.toLowerCase() !== "kigali" && loc.city?.toLowerCase() !== "gasabo")) {
        // Fallback: If city isn't explicitly Musanze or Nairobi, group in Kigali
        if (loc.city?.toLowerCase() === "musanze" || loc.city?.toLowerCase() === "nairobi") return false;
      }
      if (selectedRegion === "musanze" && loc.city?.toLowerCase() !== "musanze") return false;
      if (selectedRegion === "nairobi" && loc.city?.toLowerCase() !== "nairobi") return false;

      // Category filter
      if (selectedCategory !== "all" && loc.provider?.category?.toLowerCase() !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [locations, selectedRegion, selectedCategory]);

  // Coordinate projection from Kigali Lat/Lng to SVG viewbox (0 to 600, 0 to 360)
  // Kigali approximate bounding box: Lat -1.90 to -2.00, Lng 30.00 to 30.15
  const projectedPins = useMemo(() => {
    const minLat = -2.02;
    const maxLat = -1.90;
    const minLng = 29.98;
    const maxLng = 30.16;

    return filteredLocations.map((loc, index) => {
      let x = 300;
      let y = 180;

      if (loc.lat !== null && loc.lng !== null) {
        x = ((loc.lng - minLng) / (maxLng - minLng)) * 540 + 30;
        y = ((maxLat - loc.lat) / (maxLat - minLat)) * 300 + 30;
      } else {
        // Deterministic pseudo-spread for venues with pending coordinates
        const angle = (index / Math.max(1, filteredLocations.length)) * 2 * Math.PI;
        x = 300 + Math.cos(angle) * (60 + (index % 5) * 20);
        y = 180 + Math.sin(angle) * (50 + (index % 4) * 15);
      }

      return {
        ...loc,
        svgX: Math.max(20, Math.min(580, x)),
        svgY: Math.max(20, Math.min(340, y)),
      };
    });
  }, [filteredLocations]);

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "pool": return "#00D2B4"; // Kinetic Teal
      case "studio": return "#8B5CF6"; // Purple
      case "wellness_center": return "#F59E0B"; // Amber
      case "clinic": return "#3B82F6"; // Blue
      default: return "#10B981"; // Emerald (Gym/Fitness)
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Top Map Control Header */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#0B1F33] text-[#28D17C]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1F33]">
              Provider Network Geo-Coverage Map
            </h3>
            <p className="text-[11px] text-slate-500">
              Contracted facility venues across East African urban corridors
            </p>
          </div>
        </div>

        {/* Region Selector Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setSelectedRegion("kigali")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedRegion === "kigali"
                ? "bg-[#0B1F33] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kigali Hub
          </button>
          <button
            onClick={() => setSelectedRegion("musanze")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedRegion === "musanze"
                ? "bg-[#0B1F33] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Musanze Node
          </button>
          <button
            onClick={() => setSelectedRegion("nairobi")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedRegion === "nairobi"
                ? "bg-[#0B1F33] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Nairobi Expansion
          </button>
        </div>
      </div>

      {/* Category Filter Pills & Density Bar */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: "all", label: "All Venues", color: "#0B1F33" },
            { id: "gym", label: "Fitness & Gyms", color: "#10B981" },
            { id: "pool", label: "Swimming Pools", color: "#00D2B4" },
            { id: "studio", label: "Yoga & Studios", color: "#8B5CF6" },
            { id: "wellness_center", label: "Spas & Wellness", color: "#F59E0B" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-slate-100 text-slate-900 font-semibold border border-slate-300 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Showing <span className="font-bold text-[#0B1F33]">{projectedPins.length}</span> venues
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative bg-[#071521] overflow-hidden min-h-[360px] flex items-center justify-center">
        {/* Subtle Map Grid lines & Architectural Backdrop */}
        <svg
          className="w-full h-[360px] select-none"
          viewBox="0 0 600 360"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#132D43" strokeWidth="0.75" />
            </pattern>
            {/* Kigali Topography District Rings */}
            <radialGradient id="kigaliGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#28D17C" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#00D2B4" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#071521" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid Background */}
          <rect width="600" height="360" fill="url(#mapGrid)" />
          <circle cx="300" cy="180" r="160" fill="url(#kigaliGlow)" />

          {/* District Boundary Sketches (Gasabo, Nyarugenge, Kicukiro) */}
          <g stroke="#21405A" strokeWidth="1.5" strokeDasharray="4 4" fill="none">
            {/* Gasabo North */}
            <path d="M 120 70 Q 280 40 460 80 Q 520 160 440 220 Q 320 180 200 200 Z" opacity="0.6" />
            {/* Nyarugenge West */}
            <path d="M 140 180 Q 240 170 290 220 Q 260 290 160 280 Z" opacity="0.6" />
            {/* Kicukiro South */}
            <path d="M 280 210 Q 420 200 480 260 Q 400 320 270 300 Z" opacity="0.6" />
          </g>

          {/* District Labels */}
          <text x="320" y="95" fill="#526173" fontSize="10" fontFamily="Inter" fontWeight="600" letterSpacing="1.5">
            GASABO DISTRICT
          </text>
          <text x="160" y="240" fill="#526173" fontSize="10" fontFamily="Inter" fontWeight="600" letterSpacing="1.5">
            NYARUGENGE
          </text>
          <text x="360" y="275" fill="#526173" fontSize="10" fontFamily="Inter" fontWeight="600" letterSpacing="1.5">
            KICUKIRO
          </text>

          {/* Plotted Facility Venue Pins */}
          {projectedPins.map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            const pinColor = getCategoryColor(loc.provider?.category);

            return (
              <g
                key={loc.id}
                transform={`translate(${loc.svgX}, ${loc.svgY})`}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => setSelectedLocation(loc)}
              >
                {/* Ping animation for selected or verified */}
                {isSelected && (
                  <circle r="14" fill={pinColor} opacity="0.3" className="animate-ping" />
                )}
                <circle
                  r={isSelected ? "8" : "5.5"}
                  fill={pinColor}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                  className="shadow-sm transition-all"
                />
              </g>
            );
          })}
        </svg>

        {/* Selected Facility Popover Overlay Card */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md rounded-xl p-4 border border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: getCategoryColor(selectedLocation.provider?.category) }}
                >
                  {selectedLocation.provider?.category || "Gym"}
                </span>
                <h4 className="font-bold text-xs text-[#0B1F33] mt-1.5 leading-snug">
                  {selectedLocation.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {selectedLocation.provider?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1 truncate max-w-[170px]">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{selectedLocation.address || selectedLocation.city}</span>
              </span>
              <button
                onClick={() => {
                  openDrawer("location", selectedLocation.id, selectedLocation, selectedLocation.name);
                }}
                className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
              >
                <span>Inspect</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span>Fitness Facility</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D2B4]" />
            <span>Olympic Pool</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
            <span>Studio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>Wellness/Spa</span>
          </div>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          EPSG:4326 Kigali Standard Datum
        </div>
      </div>
    </div>
  );
}
