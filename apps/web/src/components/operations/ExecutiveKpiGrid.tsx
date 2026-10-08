"use client";

import React from "react";
import { 
  Building2, 
  Network, 
  Users, 
  Activity, 
  TrendingUp, 
  Coins, 
  MapPin, 
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { formatCurrencyDisplay } from "@/lib/utils";

interface OperationsOverviewData {
  network: {
    employers: { total: number; active: number; onboarding: number };
    providers: { total: number; active: number; inReview: number; byCategory: Record<string, number> };
    facilities: { total: number; withCoordinates: number };
  };
  beneficiaries: {
    totalEligible: number;
    activeRoster: number;
    monthlyActiveBeneficiaries: number;
    utilizationRate: number;
  };
  visits: {
    today: number;
    todayVerified: number;
    thisWeek: number;
    thisMonth: number;
    hourlyTrend24h: number[];
    verificationSuccessRate: number;
    activeDisputes: number;
  };
  financials: {
    currency: string;
    invoicedMtd: number;
    providerSettlementsMtd: number;
    grossMarginSpread: number;
    grossMarginPercentage: number;
  };
}

interface ExecutiveKpiGridProps {
  data: OperationsOverviewData;
}

export function ExecutiveKpiGrid({ data }: ExecutiveKpiGridProps) {
  const { network, beneficiaries, visits, financials } = data;

  // Generate SVG Sparkline polyline points from 24h hourly distribution
  const sparklineData = visits.hourlyTrend24h || new Array(24).fill(0);
  const maxVal = Math.max(...sparklineData, 1);
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / 23) * 120;
      const y = 32 - (val / maxVal) * 26;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="@container">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Network Scale */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                Network Scale
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Network className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#0B1F33]">
                {network.providers.total}
              </span>
              <span className="text-xs text-slate-500 font-medium">Providers</span>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-lg font-bold font-mono text-slate-700">
                {network.facilities.total}
              </span>
              <span className="text-xs text-slate-500 font-medium">Venues</span>
            </div>

            <p className="text-[11px] text-slate-500 mt-1">
              Active across Gasabo, Kicukiro & Nyarugenge districts.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{network.employers.total} Corporate Clients</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[10px]">
              {network.providers.active} Active
            </span>
          </div>
        </div>

        {/* Card 2: Beneficiary Engagement */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                Beneficiary Adoption
              </span>
              <div className="p-2 rounded-xl bg-teal-50 text-[#00D2B4]">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#0B1F33]">
                {beneficiaries.utilizationRate}%
              </span>
              <span className="text-xs text-slate-500 font-medium">Network Utilization</span>
            </div>

            <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#28D17C] to-[#00D2B4] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, beneficiaries.utilizationRate))}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>{beneficiaries.monthlyActiveBeneficiaries} Monthly Active (MAB)</span>
            <span className="font-mono text-slate-400">/ {beneficiaries.activeRoster} Roster</span>
          </div>
        </div>

        {/* Card 3: Visit Velocity & 24h Trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                Visit Velocity
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-[#0B1F33]">
                    {visits.thisMonth}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">MTD Visits</span>
                </div>
                <div className="text-[11px] text-[#008A4B] font-semibold mt-0.5">
                  {visits.verificationSuccessRate}% Pass Rate
                </div>
              </div>

              {/* 24-Hour Hourly Trend Sparkline */}
              <div className="w-28 h-8 flex flex-col items-end">
                <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 32">
                  <polyline
                    fill="none"
                    stroke="#28D17C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
                <span className="text-[9px] font-mono text-slate-400">24h Hourly Trend</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>{visits.thisWeek} Visits This Week</span>
            <span className="font-mono text-emerald-600 font-medium">+{visits.today} Today</span>
          </div>
        </div>

        {/* Card 4: Marketplace Financial Ticker (Gross Margin Spread) */}
        <div className="bg-[#0B1F33] text-white rounded-2xl p-5 border border-[#21405A] shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
                Marketplace Margin Ticker
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] text-[10px] font-mono font-bold border border-[#28D17C]/30">
                +{financials.grossMarginPercentage}% SPREAD
              </span>
            </div>

            <div className="mt-1">
              <div className="text-2xl font-bold font-mono tracking-tight text-[#28D17C]">
                {formatCurrencyDisplay(financials.grossMarginSpread)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PolyFit Net Spread (Billed Amount - Payout Liability)
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#21405A] space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Invoiced MTD:</span>
              <span className="font-mono">{formatCurrencyDisplay(financials.invoicedMtd)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Provider Settlements:</span>
              <span className="font-mono text-slate-300">{formatCurrencyDisplay(financials.providerSettlementsMtd)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
