"use client";

import React, { useState } from "react";
import { Dumbbell, Waves, Sparkles, HeartPulse, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryData {
  category: string;
  label: string;
  visits: number;
  percentage: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CategoryDistributionProps {
  categories?: {
    gym?: number;
    pool?: number;
    studio?: number;
    clinic?: number;
    wellness_center?: number;
  };
  totalVisits?: number;
  className?: string;
}

export function CategoryDistribution({
  categories = { gym: 710, pool: 355, studio: 236, clinic: 179 },
  totalVisits = 1480,
  className,
}: CategoryDistributionProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categoryList: CategoryData[] = [
    {
      category: "gym",
      label: "Fitness & Gyms",
      visits: categories.gym || 710,
      percentage: totalVisits > 0 ? Math.round(((categories.gym || 710) / totalVisits) * 100) : 48,
      color: "#0B1F33",
      icon: Dumbbell,
    },
    {
      category: "pool",
      label: "Swimming Pools",
      visits: categories.pool || 355,
      percentage: totalVisits > 0 ? Math.round(((categories.pool || 355) / totalVisits) * 100) : 24,
      color: "#00D2B4",
      icon: Waves,
    },
    {
      category: "studio",
      label: "Yoga & Studios",
      visits: categories.studio || 236,
      percentage: totalVisits > 0 ? Math.round(((categories.studio || 236) / totalVisits) * 100) : 16,
      color: "#28D17C",
      icon: Sparkles,
    },
    {
      category: "clinic",
      label: "Clinics & Physio",
      visits: categories.clinic || 179,
      percentage: totalVisits > 0 ? Math.round(((categories.clinic || 179) / totalVisits) * 100) : 12,
      color: "#3B82F6",
      icon: HeartPulse,
    },
  ];

  // SVG Donut Calculations
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  return (
    <div className={cn("p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-[#0B1F33]">
            Wellness Dimensions
          </h3>
          <p className="text-xs text-[#526173]">
            Workforce activity across network provider categories
          </p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0F9F5] text-[#00584B]">
          4 Categories
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center my-auto py-2">
        {/* SVG Donut Chart */}
        <div className="sm:col-span-5 flex justify-center relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {categoryList.map((item) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle;
              cumulativeAngle += (item.percentage / 100) * circumference;
              const isHovered = hoveredCategory === item.category;

              return (
                <circle
                  key={item.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
          </svg>

          {/* Donut Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-bold text-[#0B1F33]">
              {totalVisits.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-[#8491A3] uppercase tracking-wider">
              Total Visits
            </span>
          </div>
        </div>

        {/* Category Breakdown Legend */}
        <div className="sm:col-span-7 space-y-2">
          {categoryList.map((item) => {
            const Icon = item.icon;
            const isHovered = hoveredCategory === item.category;

            return (
              <div
                key={item.category}
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={cn(
                  "p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer border",
                  isHovered
                    ? "bg-[#F7F9FC] border-[#E2E8F0] shadow-xs scale-[1.02]"
                    : "border-transparent hover:bg-[#F7F9FC]"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-[#0B1F33] truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-[#8491A3]">
                      {item.visits} verified check-ins
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[#0B1F33]">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-[#F1F4F8] flex items-center justify-between text-[11px] text-[#8491A3]">
        <span>Cross-provider network usage</span>
        <span className="text-[#28D17C] font-semibold">100% Employer Funded</span>
      </div>
    </div>
  );
}
