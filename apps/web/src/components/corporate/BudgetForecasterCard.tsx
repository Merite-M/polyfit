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
    <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E0F9F5] text-[#007A68] flex items-center justify-center">
              <Calculator className="w-4 h-4 text-[#00D2B4]" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33]">
              Benefit Liability & Budget Forecaster
            </h3>
          </div>
          <p className="text-xs text-[#526173] mt-1">
            Simulate monthly corporate wellness spend based on workforce headcount, visit frequency, and co-pay policy.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E9FAF2] border border-[#B7F1D2] text-[#008A4B] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#28D17C]" />
          <span>RRA 30% CIT Tax Shield Active</span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Interactive Sliders */}
        <div className="lg:col-span-5 space-y-6">
          {/* Headcount Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label className="font-semibold text-[#0B1F33] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#8491A3]" />
                <span>Eligible Headcount</span>
              </label>
              <span className="font-bold text-[#0B1F33] font-mono px-2 py-0.5 rounded bg-[#F1F4F8]">
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
              className="w-full accent-[#28D17C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8491A3] mt-1">
              <span>10 staff</span>
              <span>500 staff</span>
              <span>1,000 staff</span>
            </div>
          </div>

          {/* Visits Frequency Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label className="font-semibold text-[#0B1F33] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#8491A3]" />
                <span>Expected Visits / Member</span>
              </label>
              <span className="font-bold text-[#0B1F33] font-mono px-2 py-0.5 rounded bg-[#F1F4F8]">
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
              className="w-full accent-[#28D17C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8491A3] mt-1">
              <span>1 visit</span>
              <span>8 visits (avg)</span>
              <span>16 visits (active)</span>
            </div>
          </div>

          {/* Co-Pay Split Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label className="font-semibold text-[#0B1F33] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#8491A3]" />
                <span>Employee Co-Pay Split</span>
              </label>
              <span className="font-bold text-[#0B1F33] font-mono px-2 py-0.5 rounded bg-[#F1F4F8]">
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
              className="w-full accent-[#28D17C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8491A3] mt-1">
              <span>0% (Fully Funded)</span>
              <span>25% Co-Pay</span>
              <span>50% (Half-and-Half)</span>
            </div>
          </div>

          {/* Average Contract Rate Setting */}
          <div className="pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#526173]">Network Avg Contract Rate:</span>
              <span className="font-bold text-[#0B1F33] font-mono">{formatRwf(contractRate)} / visit</span>
            </div>
            <p className="text-[11px] text-[#8491A3] mt-1">
              Based on active contracts across Kigali facilities (~4,926 RWF blended rate).
            </p>
          </div>
        </div>

        {/* Right Side: Live Forecast Readout */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {/* Total Visits */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-medium text-[#8491A3] uppercase tracking-wider">
                Monthly Visits
              </div>
              <div className="text-xl font-bold text-[#0B1F33] mt-1 font-mono">
                {new Intl.NumberFormat().format(metrics.totalVisits)}
              </div>
              <div className="text-[11px] text-[#526173] mt-0.5">
                {headcount} staff × {avgVisits} visits
              </div>
            </div>

            {/* Gross Value */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-medium text-[#8491A3] uppercase tracking-wider">
                Gross Wellness Value
              </div>
              <div className="text-xl font-bold text-[#0B1F33] mt-1 font-mono">
                {formatRwf(metrics.grossValue)}
              </div>
              <div className="text-[11px] text-[#526173] mt-0.5">
                Total facility billing
              </div>
            </div>

            {/* Employee Co-Pay */}
            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
              <div className="text-[11px] font-medium text-[#D97706] uppercase tracking-wider">
                Employee Co-Pay ({copayPct}%)
              </div>
              <div className="text-xl font-bold text-[#D97706] mt-1 font-mono">
                {formatRwf(metrics.employeeCopay)}
              </div>
              <div className="text-[11px] text-[#B45309] mt-0.5">
                Payroll deducted / co-paid
              </div>
            </div>

            {/* Employer Net Monthly Liability */}
            <div className="p-4 rounded-xl bg-[#E0F9F5] border border-[#A7F3E5] sm:col-span-2">
              <div className="text-[11px] font-semibold text-[#007A68] uppercase tracking-wider">
                Net Employer Monthly Liability
              </div>
              <div className="text-2xl font-black text-[#0B1F33] mt-1 font-mono">
                {formatRwf(metrics.employerLiability)}
              </div>
              <div className="text-xs text-[#00584B] mt-0.5 flex items-center gap-1">
                <span>PMPM:</span>
                <span className="font-bold font-mono">{formatRwf(metrics.pmpm)} / member</span>
              </div>
            </div>

            {/* Rwanda 30% Tax Shield */}
            <div className="p-4 rounded-xl bg-[#E9FAF2] border border-[#B7F1D2]">
              <div className="text-[11px] font-semibold text-[#008A4B] uppercase tracking-wider">
                Rwanda 30% CIT Shield
              </div>
              <div className="text-lg font-bold text-[#008A4B] mt-1 font-mono">
                -{formatRwf(metrics.taxShield)}
              </div>
              <div className="text-[11px] text-[#008A4B] mt-0.5">
                Welfare tax deduction
              </div>
            </div>
          </div>

          {/* Bottom Tax Compliance Banner */}
          <div className="mt-4 p-3.5 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1]/60 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#007A68] mt-0.5 shrink-0" />
            <div className="text-[11px] text-[#475569] leading-relaxed">
              <strong className="text-[#0B1F33]">Rwanda Tax Treatment: </strong>
              Under Rwandan corporate tax regulations, employer-subsidized employee preventative health and fitness benefits are classified as 100% allowable business welfare expenses, yielding an effective corporate tax saving of 30%. Net after-tax commitment:{" "}
              <strong className="text-[#008A4B] font-mono">{formatRwf(metrics.netAfterTax)}</strong> (~{formatRwf(metrics.effectivePmpm)} PMPM).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
