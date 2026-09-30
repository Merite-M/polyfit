'use client';

import React, { useState } from 'react';
import {
  Clock,
  Flame,
  Info,
  Users,
  Sun,
  Moon,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

type DayFilter = 'all' | 'weekday' | 'weekend';

export function PeakHoursHeatmap() {
  const { dashboardData } = usePartner();
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const heatmap = dashboardData?.peak_hours_heatmap;

  // Select appropriate dataset based on filter
  const full24 =
    dayFilter === 'weekday'
      ? heatmap?.weekday_hours_24 || Array(24).fill(0)
      : dayFilter === 'weekend'
      ? heatmap?.weekend_hours_24 || Array(24).fill(0)
      : heatmap?.hours_24 || Array(24).fill(0);

  // Focus on 06:00 to 22:00 (hours 6 through 22, 17 hours total)
  const displayHours = Array.from({ length: 17 }, (_, i) => i + 6);
  const maxVal = Math.max(...displayHours.map((h) => full24[h] || 0), 1);

  const getRushType = (h: number): 'morning' | 'lunch' | 'evening' | null => {
    if (h >= 6 && h <= 8) return 'morning';
    if (h >= 12 && h <= 13) return 'lunch';
    if (h >= 17 && h <= 19) return 'evening';
    return null;
  };

  const getBarColor = (count: number, h: number) => {
    const rush = getRushType(h);
    const ratio = count / maxVal;

    if (rush === 'evening') {
      return ratio > 0.6 ? 'bg-[#28D17C]' : 'bg-[#28D17C]/70';
    }
    if (rush === 'morning') {
      return ratio > 0.5 ? 'bg-[#3B82F6]' : 'bg-[#3B82F6]/70';
    }
    if (rush === 'lunch') {
      return 'bg-[#8B5CF6]/80';
    }
    return ratio > 0.4 ? 'bg-[#0B1F33]/60' : 'bg-[#CBD5E1]';
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs">
      {/* Top Header & Day Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F4F8]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#28D17C]/15 text-[#008A4B] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1F33]">
                Facility Utilization & Peak Rush Heatmap
              </h3>
              <p className="text-xs text-[#526173]">
                Hourly check-in volume distribution (06:00 – 22:00) to optimize front desk & trainer staffing.
              </p>
            </div>
          </div>
        </div>

        {/* Day Filter Pills */}
        <div className="inline-flex rounded-xl bg-[#F7F9FC] p-1 border border-[#E2E8F0] self-start sm:self-auto">
          <button
            onClick={() => setDayFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              dayFilter === 'all'
                ? 'bg-white text-[#0B1F33] shadow-xs border border-[#E2E8F0]'
                : 'text-[#526173] hover:text-[#0B1F33]'
            }`}
          >
            All Days
          </button>
          <button
            onClick={() => setDayFilter('weekday')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              dayFilter === 'weekday'
                ? 'bg-white text-[#0B1F33] shadow-xs border border-[#E2E8F0]'
                : 'text-[#526173] hover:text-[#0B1F33]'
            }`}
          >
            Mon – Fri
          </button>
          <button
            onClick={() => setDayFilter('weekend')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              dayFilter === 'weekend'
                ? 'bg-white text-[#0B1F33] shadow-xs border border-[#E2E8F0]'
                : 'text-[#526173] hover:text-[#0B1F33]'
            }`}
          >
            Sat – Sun
          </button>
        </div>
      </div>

      {/* Heatmap Bar Chart Display */}
      <div className="pt-6 pb-2">
        <div className="flex items-end gap-1.5 sm:gap-2.5 h-44 px-2">
          {displayHours.map((h) => {
            const val = full24[h] || 0;
            const heightPercent = Math.max(Math.round((val / maxVal) * 100), 8);
            const isHovered = hoveredHour === h;
            const rush = getRushType(h);

            return (
              <div
                key={h}
                onMouseEnter={() => setHoveredHour(h)}
                onMouseLeave={() => setHoveredHour(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 bg-[#0B1F33] text-white px-2.5 py-1 rounded-lg text-[11px] font-mono shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                    <span className="font-bold text-[#28D17C]">{val} check-ins</span> at {String(h).padStart(2, '0')}:00
                  </div>
                )}

                {/* Bar Value on Top if significant */}
                <span className={`text-[10px] font-mono mb-1 transition-opacity ${val > 0 ? 'text-[#526173]' : 'text-transparent'} ${isHovered ? 'font-bold text-[#0B1F33]' : ''}`}>
                  {val > 0 ? val : ''}
                </span>

                {/* Animated Vertical Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-md transition-all duration-300 ${getBarColor(val, h)} ${
                    isHovered ? 'brightness-110 ring-2 ring-[#0B1F33]/20' : ''
                  }`}
                />

                {/* Hour Label */}
                <div className="mt-2 text-center">
                  <span className={`text-[11px] font-mono block ${isHovered ? 'font-bold text-[#0B1F33]' : 'text-[#8491A3]'}`}>
                    {String(h).padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Rush Hour Highlights */}
      <div className="mt-4 pt-4 border-t border-[#F1F4F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#3B82F6]"></span>
            <span className="text-[#526173] font-medium">Morning Rush (06:00 – 09:00)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#8B5CF6]"></span>
            <span className="text-[#526173] font-medium">Lunch Break (12:00 – 14:00)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#28D17C]"></span>
            <span className="text-[#0B1F33] font-bold">Evening Corporate Rush (17:00 – 20:00)</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[#008A4B] font-semibold bg-[#E9FAF2] px-2.5 py-1 rounded-lg border border-[#B7F1D2]">
          <Flame className="w-3.5 h-3.5 text-[#008A4B]" />
          <span>Peak Workout Surge: 17:00 – 19:00</span>
        </div>
      </div>
    </div>
  );
}
