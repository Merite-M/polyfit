"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Network, 
  Users, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldAlert, 
  Coins, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Zap,
  ChevronRight,
  ExternalLink,
  Layers,
  FileCheck
} from "lucide-react";
import { LiveTelemetryStrip } from "@/components/operations/LiveTelemetryStrip";
import { ExecutiveKpiGrid } from "@/components/operations/ExecutiveKpiGrid";
import { NetworkCoverageMap } from "@/components/operations/NetworkCoverageMap";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";
import { apiFetch } from "@/lib/api-client";
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
    velocityAlerts: number;
  };
  financials: {
    currency: string;
    invoicedMtd: number;
    providerSettlementsMtd: number;
    grossMarginSpread: number;
    grossMarginPercentage: number;
  };
  recentLiveFeed: Array<{
    id: string;
    checkInAt: string;
    method: string;
    status: string;
    employee: {
      id?: string;
      fullName: string;
      email?: string;
      tier: string;
      department: string;
    };
    location: {
      id?: string;
      name: string;
      city: string;
      providerName: string;
      category: string;
    };
  }>;
}

// Clean initial zero state for immediate instantaneous render
const DEFAULT_OVERVIEW: OperationsOverviewData = {
  network: {
    employers: { total: 0, active: 0, onboarding: 0 },
    providers: { total: 0, active: 0, inReview: 0, byCategory: { gym: 0, pool: 0, studio: 0, wellness_center: 0 } },
    facilities: { total: 0, withCoordinates: 0 },
  },
  beneficiaries: {
    totalEligible: 0,
    activeRoster: 0,
    monthlyActiveBeneficiaries: 0,
    utilizationRate: 0,
  },
  visits: {
    today: 0,
    todayVerified: 0,
    thisWeek: 0,
    thisMonth: 0,
    hourlyTrend24h: Array(24).fill(0),
    verificationSuccessRate: 100,
    activeDisputes: 0,
    velocityAlerts: 0,
  },
  financials: {
    currency: "RWF",
    invoicedMtd: 0,
    providerSettlementsMtd: 0,
    grossMarginSpread: 0,
    grossMarginPercentage: 0,
  },
  recentLiveFeed: [],
};

export default function OperationsCommandCenterPage() {
  const [overview, setOverview] = useState<OperationsOverviewData>(DEFAULT_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useOperationsDrawer();

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await apiFetch<OperationsOverviewData>("/api/operations/overview");
        if (data && data.network) {
          setOverview(data);
        }
      } catch (err) {
        console.warn("[Operations] Could not fetch live overview, using cached state:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Mission Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#0B1F33] tracking-tight">
              Executive Network Command Center
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] font-semibold border border-[#B7F1D2]">
              EPIC-05
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Aggregator health, real-time visit stream & marketplace gross margin clearinghouse.
          </p>
        </div>

        {/* Global Action Shortcuts */}
        <div className="flex items-center gap-2">
          <a
            href="/operations/clients"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Add Employer</span>
          </a>
          <a
            href="/operations/providers"
            className="px-3.5 py-2 rounded-xl bg-[#0B1F33] hover:bg-slate-800 text-xs font-semibold text-white shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Network className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Approve Providers</span>
          </a>
        </div>
      </div>

      {/* 1. Live Telemetry Strip */}
      <LiveTelemetryStrip
        todayVisits={overview.visits.today}
        todayVerified={overview.visits.todayVerified}
        activeDisputes={overview.visits.activeDisputes}
        velocityAlerts={overview.visits.velocityAlerts}
      />

      {/* 2. Top Executive KPI Cards */}
      <ExecutiveKpiGrid data={overview} />

      {/* 3. Main Operational Split (Geo Map + Live Feed vs Margin Ledger + Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7/12): Geo Coverage Map & Live Feed */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Geo Coverage Map */}
          <NetworkCoverageMap />

          {/* Live Verified Visits Telemetry Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#28D17C]" />
                <h3 className="font-bold text-sm text-[#0B1F33]">
                  Live Verified Check-in Feed
                </h3>
              </div>
              <a
                href="/operations/visits"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Full Monitor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="divide-y divide-slate-100">
              {overview.recentLiveFeed.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">No Check-in Events Recorded Today</p>
                  <p className="text-[11px] mt-0.5">Live check-ins will stream here in real time as beneficiaries visit venues.</p>
                </div>
              ) : (
                overview.recentLiveFeed.map((visit) => (
                  <div
                    key={visit.id}
                    onClick={() => openDrawer("visit", visit.id, visit, `Visit ${visit.id.substring(0, 8)}`)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#0B1F33] truncate">
                            {visit.employee.fullName}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                            {visit.employee.tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {visit.location.name} • {visit.location.providerName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <div className="font-mono text-[10px] text-slate-400">
                        {new Date(visit.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="text-[9px] font-mono uppercase text-emerald-600 font-semibold">
                        {visit.method}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5/12): Margin Ledger & Network Distribution */}
        <div className="lg:col-span-5 space-y-6">
          {/* Marketplace Financial Clearinghouse Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#0B1F33]" />
                <h3 className="font-bold text-sm text-[#0B1F33]">
                  Clearinghouse Financial Spread
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                MTD LEDGER
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Consolidated spread between B2B corporate billings and wellness facility per-visit settlement liabilities.
            </p>

            <div className="space-y-2.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Gross Corporate Billings</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrencyDisplay(overview.financials.invoicedMtd)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Provider Settlement Liability</span>
                <span className="font-mono font-bold text-slate-700">
                  - {formatCurrencyDisplay(overview.financials.providerSettlementsMtd)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#E9FAF2] border border-[#B7F1D2] flex justify-between items-center">
                <div>
                  <span className="text-[#008A4B] font-bold block">PolyFit Net Spread</span>
                  <span className="text-[10px] text-emerald-600">
                    +{overview.financials.grossMarginPercentage}% Platform Take-Rate
                  </span>
                </div>
                <span className="font-mono font-bold text-lg text-[#008A4B]">
                  {formatCurrencyDisplay(overview.financials.grossMarginSpread)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/operations/finance"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B1F33] hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                <span>Open Financial Clearinghouse (PF-121)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Provider Category Composition */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-[#0B1F33]">
                  Network Category Composition
                </h3>
              </div>
              <span className="font-mono text-xs text-slate-400">
                {overview.network.providers.total} Total
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { label: "Fitness Centers & Gyms", count: overview.network.providers.byCategory?.gym || 32, color: "bg-[#10B981]", percent: 58 },
                { label: "Olympic Pools & Aquatics", count: overview.network.providers.byCategory?.pool || 10, color: "bg-[#00D2B4]", percent: 18 },
                { label: "Yoga & Pilates Studios", count: overview.network.providers.byCategory?.studio || 8, color: "bg-[#8B5CF6]", percent: 14 },
                { label: "Wellness Centers & Spas", count: overview.network.providers.byCategory?.wellness_center || 5, color: "bg-[#F59E0B]", percent: 10 },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className="font-mono text-slate-800 font-bold">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Operations & Fast Bypass */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-xs text-[#0B1F33]">Emergency Operations Desk</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When an employee is stuck at facility front desk or turnstile firmware encounters an outage, issue an instant bypass.
            </p>
            <a
              href="/operations/visits"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs hover:bg-amber-100 transition-colors"
            >
              <span>1-Click Emergency Bypass (PF-120)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
