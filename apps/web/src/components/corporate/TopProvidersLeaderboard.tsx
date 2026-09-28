"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Star,
  ExternalLink,
  Dumbbell,
  Waves,
  Sparkles,
  HeartPulse,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProviderItem {
  id: string;
  name: string;
  category: "gym" | "pool" | "studio" | "clinic" | "wellness_center";
  location: string;
  visits: number;
  percentage: number;
  rating: number;
}

interface TopProvidersLeaderboardProps {
  providers?: ProviderItem[];
  className?: string;
}

const DEFAULT_PROVIDERS: ProviderItem[] = [
  {
    id: "p1",
    name: "FitLife Gym Kigali",
    category: "gym",
    location: "Kigali Heights, Kimihurura",
    visits: 480,
    percentage: 32.4,
    rating: 4.9,
  },
  {
    id: "p2",
    name: "Cercle Sportif Olympic Pool",
    category: "pool",
    location: "Rugunga, Kigali",
    visits: 355,
    percentage: 24.0,
    rating: 4.8,
  },
  {
    id: "p3",
    name: "Waka Fitness Studio",
    category: "studio",
    location: "Downtown Oasis, Kigali",
    visits: 236,
    percentage: 15.9,
    rating: 4.9,
  },
  {
    id: "p4",
    name: "Nyarutarama Tennis & Wellness",
    category: "gym",
    location: "Nyarutarama, Kigali",
    visits: 195,
    percentage: 13.2,
    rating: 4.7,
  },
  {
    id: "p5",
    name: "Kigali Physio & Recovery Clinic",
    category: "clinic",
    location: "Remera, Gasabo",
    visits: 179,
    percentage: 12.1,
    rating: 4.9,
  },
];

export function TopProvidersLeaderboard({
  providers = DEFAULT_PROVIDERS,
  className,
}: TopProvidersLeaderboardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "pool":
        return <Waves className="w-3.5 h-3.5 text-[#00D2B4]" />;
      case "studio":
        return <Sparkles className="w-3.5 h-3.5 text-[#28D17C]" />;
      case "clinic":
        return <HeartPulse className="w-3.5 h-3.5 text-[#3B82F6]" />;
      default:
        return <Dumbbell className="w-3.5 h-3.5 text-[#0B1F33]" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "pool":
        return "bg-[#E0F9F5] text-[#00584B] border-[#00D2B4]/30";
      case "studio":
        return "bg-[#E9FAF2] text-[#28D17C] border-[#28D17C]/30";
      case "clinic":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-[#F1F4F8] text-[#0B1F33] border-[#E2E8F0]";
    }
  };

  return (
    <div className={cn("p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#0B1F33]">
            Top Visited Wellness Providers
          </h3>
          <p className="text-xs text-[#526173]">
            Venues most frequented by your workforce this billing period
          </p>
        </div>
        <Link
          href="/network"
          className="text-xs font-semibold text-[#0B1F33] hover:text-[#28D17C] transition-colors flex items-center gap-1"
        >
          <span>Explore Network (29)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {providers.map((p, index) => (
          <div
            key={p.id}
            className="p-3 rounded-xl bg-[#F7F9FC] hover:bg-white border border-[#E2E8F0] transition-all flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-5 font-bold text-xs text-[#8491A3] group-hover:text-[#0B1F33] text-center">
                #{index + 1}
              </span>
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center flex-shrink-0 group-hover:border-[#28D17C] transition-colors">
                {getCategoryIcon(p.category)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0B1F33] truncate group-hover:text-[#28D17C] transition-colors">
                  {p.name}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#8491A3] truncate">
                  <MapPin className="w-3 h-3 text-[#8491A3] flex-shrink-0" />
                  <span className="truncate">{p.location}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{p.rating.toFixed(1)}</span>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-[#0B1F33]">
                  {p.visits} <span className="text-[10px] font-normal text-[#8491A3]">visits</span>
                </div>
                <div className="text-[10px] font-medium text-[#28D17C]">
                  {p.percentage}% of total
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F4F8] flex items-center justify-between text-[11px] text-[#8491A3]">
        <span>All visits authenticated via dynamic TOTP</span>
        <span className="text-[#0B1F33] font-semibold">100% Anti-Passback Enforced</span>
      </div>
    </div>
  );
}
