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
    <div className={cn("pf-roi-container", className)}>
      <div className="grid grid-cols-1 pf-roi-grid gap-4">
        {/* 1. Peak "Wellness Hour" Card (Wellhub Signature Indicator) */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Peak "Wellness Hour"
            </span>
            <p className="text-base font-bold text-foreground">
              {wellnessHour}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Most active on <span className="font-semibold text-foreground">{peakDay} evenings</span>
            </p>
          </div>
        </div>

        {/* 2. Projected Healthcare Savings (Wellhub 2.5x Multiplier) */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-105 transition-transform flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Est. Healthcare Savings
            </span>
            <p className="text-base font-bold text-foreground">
              RWF {estimatedSavingsRwf.toLocaleString()}
            </p>
            <p className="text-[11px] text-accent font-semibold">
              2.5x Return on Wellbeing (ROI)
            </p>
          </div>
        </div>

        {/* 3. Tax Deductibility & Productivity Impact */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-info/15 dark:bg-blue-950/40 flex items-center justify-center text-info group-hover:scale-105 transition-transform flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tax Deductibility (RRA)
            </span>
            <p className="text-base font-bold text-foreground">
              100% Welfare Expense
            </p>
            <p className="text-[11px] text-muted-foreground">
              +{estimatedProductivityHours.toLocaleString()} hrs productivity gained
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
