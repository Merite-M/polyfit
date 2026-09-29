'use client';

import React from 'react';
import Link from 'next/link';
import { SlidersHorizontal, ArrowRight, ShieldCheck, TrendingUp, Users, Building } from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

export default function PartnerDashboardPage() {
  const { provider, todaySummary } = usePartner();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">Partnership Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight mt-1">
            {provider?.name || 'Partner Facility'} Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Network analytics, corporate client distribution, and capacity insights.
          </p>
        </div>

        <Link
          href="/partner/checkins"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-bold transition-colors shadow-xs"
        >
          <span>Live Check-in Operations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="text-xs text-[#8491A3] font-semibold">Corporate Partner Rating</div>
          <div className="text-2xl font-extrabold text-[#0B1F33] mt-1 flex items-center gap-2">
            <span>{provider?.rating || '4.8'}</span>
            <span className="text-xs font-normal text-[#28D17C] bg-[#E9FAF2] px-2 py-0.5 rounded-full font-bold">
              ★ Premium Provider
            </span>
          </div>
          <div className="text-[11px] text-[#526173] mt-1">Based on beneficiary ratings</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="text-xs text-[#8491A3] font-semibold">Active Corporate Clients</div>
          <div className="text-2xl font-extrabold text-[#0B1F33] mt-1">
            6 Organizations
          </div>
          <div className="text-[11px] text-[#526173] mt-1">BK, MTN, I&M, Bboxx, RDB, Airtel</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="text-xs text-[#8491A3] font-semibold">Per-Visit Reimbursement</div>
          <div className="text-2xl font-extrabold text-[#0B1F33] font-mono mt-1">
            5,000 <span className="text-xs font-sans text-[#8491A3]">RWF</span>
          </div>
          <div className="text-[11px] text-[#28D17C] font-semibold mt-1">Standard Tier Contract</div>
        </div>
      </div>
    </div>
  );
}
