"use client";

import React from "react";
import {
  Clock,
  HeartHandshake,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoiMetricsCardProps {
  activeEmployees?: number;
  totalSpendRwf?: number;
  wellnessHour?: string;
  peakDay?: string;
  className?: string;
}

export function RoiMetricsCard({
  activeEmployees = 412,
  totalSpendRwf = 1892000,
  wellnessHour = "17:00 - 18:00",
  peakDay = "Wednesday",
  className,
}: RoiMetricsCardProps) {
  // Wellhub Benchmark: 2.5x healthcare savings + 3.5 productivity hours saved
  const estimatedSavingsRwf = Math.round(totalSpendRwf * 2.5);
  const estimatedProductivityHours = Math.round(activeEmployees * 3.5);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {/* 1. Peak "Wellness Hour" Card (Wellhub Signature Indicator) */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-3.5 group">
        <div className="w-10 h-10 rounded-xl bg-[#E0F9F5] flex items-center justify-center text-[#00D2B4] group-hover:scale-105 transition-transform flex-shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8491A3]">
            Peak "Wellness Hour"
          </span>
          <p className="text-base font-bold text-[#0B1F33]">
            {wellnessHour}
          </p>
          <p className="text-[11px] text-[#526173]">
            Most active on <span className="font-semibold text-[#0B1F33]">{peakDay} evenings</span>
          </p>
        </div>
      </div>

      {/* 2. Projected Healthcare Savings (Wellhub 2.5x Multiplier) */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-3.5 group">
        <div className="w-10 h-10 rounded-xl bg-[#E9FAF2] flex items-center justify-center text-[#28D17C] group-hover:scale-105 transition-transform flex-shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8491A3]">
            Est. Healthcare Savings
          </span>
          <p className="text-base font-bold text-[#0B1F33]">
            RWF {estimatedSavingsRwf.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#28D17C] font-semibold">
            2.5x Return on Wellbeing (ROI)
          </p>
        </div>
      </div>

      {/* 3. Tax Deductibility & Productivity Impact */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-3.5 group">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#3B82F6] group-hover:scale-105 transition-transform flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8491A3]">
            Tax Deductibility (RRA)
          </span>
          <p className="text-base font-bold text-[#0B1F33]">
            100% Welfare Expense
          </p>
          <p className="text-[11px] text-[#526173]">
            +{estimatedProductivityHours.toLocaleString()} hrs productivity gained
          </p>
        </div>
      </div>
    </div>
  );
}
