'use client';

import React from 'react';
import {
  Users,
  TrendingUp,
  Receipt,
  Building,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { formatRwf } from '@/lib/invoice-pdf';

export function ProviderKpiGrid() {
  const { dashboardData, todaySummary } = usePartner();

  const kpis = dashboardData?.kpis;
  const todayCount = todaySummary?.total_visits_today ?? kpis?.today_visits ?? 0;
  const deltaPct = kpis?.vs_yesterday_delta_pct ?? 0;
  const isPositiveDelta = deltaPct >= 0;

  const mtdVisitors = kpis?.unique_corporate_visitors_mtd ?? 84;
  const mtdGross = kpis?.estimated_mtd_revenue_rwf ?? 1700000;
  const mtdNet = kpis?.estimated_net_payout_rwf ?? Math.round(mtdGross * 0.90);
  const activeContracts = kpis?.active_contracts_count ?? 4;
  const perVisitRate = kpis?.per_visit_rate ?? 5000;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Today's Verified Check-ins */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
        <div>
          <div className="flex items-center justify-between text-[#8491A3]">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Check-ins</span>
            <div className="w-8 h-8 rounded-lg bg-[#E9FAF2] text-[#008A4B] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B1F33] font-mono tracking-tight">
              {todayCount}
            </span>
            <span className="text-xs font-semibold text-[#526173]">visits</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F1F4F8] flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                isPositiveDelta
                  ? 'bg-[#E9FAF2] text-[#008A4B]'
                  : 'bg-[#FEE2E2] text-[#DC2626]'
              }`}
            >
              {isPositiveDelta ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{Math.abs(deltaPct)}%</span>
            </span>
            <span className="text-[11px] text-[#8491A3]">vs yesterday</span>
          </div>

          <span className="relative flex h-2 w-2" title="Real-time live counter">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28D17C] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28D17C]"></span>
          </span>
        </div>
      </div>

      {/* KPI 2: Unique Corporate Visitors (MTD) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
        <div>
          <div className="flex items-center justify-between text-[#8491A3]">
            <span className="text-xs font-bold uppercase tracking-wider">Unique Beneficiaries</span>
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B1F33] font-mono tracking-tight">
              {mtdVisitors}
            </span>
            <span className="text-xs font-semibold text-[#526173]">individuals</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F1F4F8] flex items-center justify-between text-[11px] text-[#526173]">
          <span>Corporate employees</span>
          <span className="text-[#3B82F6] font-semibold font-mono">Month-to-Date</span>
        </div>
      </div>

      {/* KPI 3: Estimated MTD Revenue */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
        <div>
          <div className="flex items-center justify-between text-[#8491A3]">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated MTD Earnings</span>
            <div className="w-8 h-8 rounded-lg bg-[#28D17C]/15 text-[#008A4B] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] font-mono tracking-tight">
              {formatRwf(mtdGross)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F1F4F8] flex items-center justify-between text-[11px]">
          <span className="text-[#8491A3]">Net Payout est:</span>
          <span className="font-mono font-bold text-[#008A4B]">{formatRwf(mtdNet)}</span>
        </div>
      </div>

      {/* KPI 4: Active Corporate Contracts */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
        <div>
          <div className="flex items-center justify-between text-[#8491A3]">
            <span className="text-xs font-bold uppercase tracking-wider">Corporate Contracts</span>
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B1F33] font-mono tracking-tight">
              {activeContracts}
            </span>
            <span className="text-xs font-semibold text-[#526173]">clients</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F1F4F8] flex items-center justify-between text-[11px]">
          <span className="text-[#8491A3]">Reimbursement:</span>
          <span className="font-mono font-bold text-[#0B1F33]">{formatRwf(perVisitRate)} / visit</span>
        </div>
      </div>
    </div>
  );
}
