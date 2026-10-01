"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Calculator,
  ShieldCheck,
  Building,
  Users,
  Activity,
  ArrowRight,
  Info,
  DollarSign,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetForecasterCardProps {
  initialHeadcount?: number;
  initialAvgRate?: number;
  onApplyPlanScenario?: (scenario: {
    headcount: number;
    visits: number;
    copay: number;
  }) => void;
}

export const BudgetForecasterCard: React.FC<BudgetForecasterCardProps> = ({
  initialHeadcount = 120,
  initialAvgRate = 5000,
  onApplyPlanScenario
}) => {
  const [headcount, setHeadcount] = useState(initialHeadcount);
  const [avgVisits, setAvgVisits] = useState(6);
  const [copayPct, setCopayPct] = useState(15);
  const [contractRate, setContractRate] = useState(initialAvgRate);

  // Dynamic simulation model
  const metrics = useMemo(() => {
    const totalVisits = headcount * avgVisits;
    const grossValue = totalVisits * contractRate;
    const employeeCopay = Math.round(grossValue * (copayPct / 100));
    const employerLiability = Math.max(0, grossValue - employeeCopay);
    const taxShield = Math.round(employerLiability * 0.30); // 30% Rwanda CIT
    const netAfterTax = employerLiability - taxShield;
    const pmpm = headcount > 0 ? Math.round(employerLiability / headcount) : 0;
    const effectivePmpm = headcount > 0 ? Math.round(netAfterTax / headcount) : 0;

    return {
      totalVisits,
      grossValue,
      employeeCopay,
      employerLiability,
      taxShield,
      netAfterTax,
      pmpm,
      effectivePmpm
    };
  }, [headcount, avgVisits, copayPct, contractRate]);

  const formatRwf = (amt: number) => {
    return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amt) + " RWF";
  };

  return (
    <div className="pf-budget-container">
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-muted/40 to-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Benefit Liability & Budget Forecaster
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Simulate monthly corporate wellness spend based on workforce headcount, visit frequency, and co-pay policy.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RRA 30% CIT Tax Shield Active</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 pf-budget-grid gap-8">
          {/* Left Side: Interactive Sliders (Responsive Controls Column via @container) */}
          <div className="pf-budget-controls space-y-6">
            {/* Headcount Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Eligible Headcount</span>
                </label>
                <span className="font-bold text-foreground font-mono px-2 py-0.5 rounded bg-muted">
                  {headcount} employees
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={headcount}
                onChange={(e) => setHeadcount(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>10 staff</span>
                <span>500 staff</span>
                <span>1,000 staff</span>
              </div>
            </div>

            {/* Visits Frequency Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Expected Visits / Member</span>
                </label>
                <span className="font-bold text-foreground font-mono px-2 py-0.5 rounded bg-muted">
                  {avgVisits} visits/month
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={16}
                step={1}
                value={avgVisits}
                onChange={(e) => setAvgVisits(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1 visit</span>
                <span>8 visits (avg)</span>
                <span>16 visits (active)</span>
              </div>
            </div>

            {/* Co-Pay Split Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Employee Co-Pay Split</span>
                </label>
                <span className="font-bold text-foreground font-mono px-2 py-0.5 rounded bg-muted">
                  {copayPct}% Co-Pay
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={copayPct}
                onChange={(e) => setCopayPct(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0% (Fully Funded)</span>
                <span>25% Co-Pay</span>
                <span>50% (Half-and-Half)</span>
              </div>
            </div>

            {/* Average Contract Rate Setting */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Network Avg Contract Rate:</span>
                <span className="font-bold text-foreground font-mono">{formatRwf(contractRate)} / visit</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Based on active contracts across Kigali facilities (~4,926 RWF blended rate).
              </p>
            </div>
          </div>

          {/* Right Side: Live Forecast Readout (Responsive Readout Column via @container) */}
          <div className="pf-budget-readout flex flex-col justify-between">
            <div className="grid grid-cols-2 pf-budget-metrics-grid gap-3.5">
              {/* Total Visits */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Monthly Visits
                </div>
                <div className="text-xl font-bold text-foreground mt-1 font-mono">
                  {new Intl.NumberFormat().format(metrics.totalVisits)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {headcount} staff × {avgVisits} visits
                </div>
              </div>

              {/* Gross Value */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Gross Wellness Value
                </div>
                <div className="text-xl font-bold text-foreground mt-1 font-mono">
                  {formatRwf(metrics.grossValue)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Total facility billing
                </div>
              </div>

              {/* Employee Co-Pay */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Employee Co-Pay ({copayPct}%)
                </div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1 font-mono">
                  {formatRwf(metrics.employeeCopay)}
                </div>
                <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  Payroll deducted / co-paid
                </div>
              </div>

              {/* Employer Net Monthly Liability */}
              <div className="p-4 rounded-xl bg-secondary/15 border border-secondary/30 sm:col-span-2">
                <div className="text-[11px] font-semibold text-secondary-foreground uppercase tracking-wider">
                  Net Employer Monthly Liability
                </div>
                <div className="text-2xl font-black text-foreground mt-1 font-mono">
                  {formatRwf(metrics.employerLiability)}
                </div>
                <div className="text-xs text-secondary-foreground/90 mt-0.5 flex items-center gap-1">
                  <span>PMPM:</span>
                  <span className="font-bold font-mono">{formatRwf(metrics.pmpm)} / member</span>
                </div>
              </div>

              {/* Rwanda 30% Tax Shield */}
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <div className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                  Rwanda 30% CIT Shield
                </div>
                <div className="text-lg font-bold text-accent mt-1 font-mono">
                  -{formatRwf(metrics.taxShield)}
                </div>
                <div className="text-[11px] text-accent/80 mt-0.5">
                  Welfare tax deduction
                </div>
              </div>
            </div>

            {/* Bottom Tax Compliance Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-muted/60 border border-border flex items-start gap-2.5">
              <Info className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Rwanda Tax Treatment: </strong>
                Under Rwandan corporate tax regulations, employer-subsidized employee preventative health and fitness benefits are classified as 100% allowable business welfare expenses, yielding an effective corporate tax saving of 30%. Net after-tax commitment:{" "}
                <strong className="text-accent font-mono">{formatRwf(metrics.netAfterTax)}</strong> (~{formatRwf(metrics.effectivePmpm)} PMPM).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
