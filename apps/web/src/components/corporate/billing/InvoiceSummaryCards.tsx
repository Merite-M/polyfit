"use client";

import React from "react";
import { formatRwf } from "@/lib/invoice-pdf";
import {
  CreditCard,
  TrendingUp,
  Activity,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

interface InvoiceSummaryCardsProps {
  currentBalance: number;
  ytdTotalSpent: number;
  ytdTotalVisits: number;
  avgCostPerVisit: number;
  citTaxShieldRwf: number;
  dueDateStr?: string;
  hasOverdue?: boolean;
  onPayNow: () => void;
}

export function InvoiceSummaryCards({
  currentBalance,
  ytdTotalSpent,
  ytdTotalVisits,
  avgCostPerVisit,
  citTaxShieldRwf,
  dueDateStr = "Oct 31, 2026",
  hasOverdue = false,
  onPayNow,
}: InvoiceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Current Balance Due */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#006D3C]/30 transition-all duration-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#28D17C]/10 to-transparent rounded-bl-full pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526173]">
              Current Balance Due
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                hasOverdue
                  ? "bg-[#DC2626]/10 text-[#DC2626]"
                  : "bg-[#005AC2]/10 text-[#005AC2]"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {hasOverdue ? "Overdue" : "Net-30 Term"}
            </span>
          </div>
          <div className="text-2xl font-black text-[#0B1F33] tracking-tight">
            {formatRwf(currentBalance)}
          </div>
          <p className="text-[11px] text-[#8491A3] mt-1 flex items-center gap-1">
            <span>Due by {dueDateStr}</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F1F4F8] flex items-center justify-between">
          <button
            onClick={onPayNow}
            className="w-full py-2 px-3 rounded-xl bg-[#006D3C] hover:bg-[#00542D] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pay Statement</span>
          </button>
        </div>
      </div>

      {/* 2. Annual Investment (YTD) */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between hover:border-[#006D3C]/30 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526173]">
              Annual Wellness Spend
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E9FAF2] text-[#006D3C] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0B1F33] tracking-tight">
            {formatRwf(ytdTotalSpent)}
          </div>
          <p className="text-[11px] text-[#16A34A] mt-1 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>+18.4% beneficiary adoption YoY</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F1F4F8] text-[11px] text-[#526173] flex items-center justify-between">
          <span>Period</span>
          <span className="font-semibold text-[#0B1F33]">FY 2026 (Jan - Dec)</span>
        </div>
      </div>

      {/* 3. Verified Beneficiary Visits */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between hover:border-[#006D3C]/30 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526173]">
              Verified Network Visits
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] text-[#005AC2] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0B1F33] tracking-tight">
            {ytdTotalVisits.toLocaleString("en-US")}
          </div>
          <p className="text-[11px] text-[#526173] mt-1 flex items-center gap-1">
            <span>Avg {formatRwf(avgCostPerVisit)} / verified visit</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F1F4F8] text-[11px] text-[#526173] flex items-center justify-between">
          <span>Cost Efficiency</span>
          <span className="font-semibold text-[#16A34A]">-34% vs Gym Retail</span>
        </div>
      </div>

      {/* 4. Rwanda CIT 30% Tax Shield */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between hover:border-[#006D3C]/30 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526173]">
              CIT 30% Tax Shield
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#7C3AED] tracking-tight">
            {formatRwf(citTaxShieldRwf)}
          </div>
          <p className="text-[11px] text-[#526173] mt-1 flex items-center gap-1">
            <span>Rwanda corporate tax deduction</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F1F4F8] text-[11px] text-[#526173] flex items-center justify-between">
          <span>Compliance</span>
          <span className="font-semibold text-[#006D3C] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#28D17C]" /> RRA EBM v2.1
          </span>
        </div>
      </div>
    </div>
  );
}
