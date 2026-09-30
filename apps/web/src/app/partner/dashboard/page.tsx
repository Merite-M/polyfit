'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Building2,
  ScanLine,
  RefreshCw,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { SecurityAlertBanner } from '@/components/partner/dashboard/SecurityAlertBanner';
import { ProviderKpiGrid } from '@/components/partner/dashboard/ProviderKpiGrid';
import { OperationalActionCards } from '@/components/partner/dashboard/OperationalActionCards';
import { PeakHoursHeatmap } from '@/components/partner/dashboard/PeakHoursHeatmap';
import { TopEmployersCard } from '@/components/partner/dashboard/TopEmployersCard';
import { RecentActivityFeed } from '@/components/partner/dashboard/RecentActivityFeed';
import { PayoutAccountModal } from '@/components/partner/settlements/PayoutAccountModal';

export default function PartnerDashboardPage() {
  const { provider, selectedLocation, selectedLocationId, refreshDashboard } = usePartner();
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDashboard();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">
              {selectedLocation ? selectedLocation.name : 'Network Overview'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight">
              {provider?.name || 'Partner Facility'} Operations Hub
            </h1>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C] animate-pulse"></span>
              Verified Provider
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Real-time corporate beneficiary check-ins, peak hours capacity, and contract performance.
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleRefresh}
            title="Refresh overview metrics"
            className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#526173] hover:text-[#0B1F33] transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#28D17C]' : ''}`} />
          </button>

          <Link
            href="/partner/partnership"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0B1F33] text-xs font-bold border border-[#E2E8F0] transition-colors shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#526173]" />
            <span>Commercial Conditions</span>
          </Link>

          <Link
            href="/partner/checkins"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-bold transition-all shadow-xs active:scale-98"
          >
            <ScanLine className="w-4 h-4" />
            <span>Live Check-in Queue</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-px">
        <Link
          href="/partner/dashboard"
          className="px-4 py-2 text-xs font-bold text-[#0B1F33] border-b-2 border-[#28D17C] -mb-px flex items-center gap-2"
        >
          <span>Home Overview & Analytics</span>
        </Link>
        <Link
          href="/partner/partnership"
          className="px-4 py-2 text-xs font-semibold text-[#526173] hover:text-[#0B1F33] transition-colors flex items-center gap-2"
        >
          <span>Commercial Conditions & Contract Terms</span>
          <span className="text-[10px] font-bold bg-[#E9FAF2] text-[#008A4B] px-1.5 py-0.2 rounded-full border border-[#B7F1D2]">
            Wellhub Tour
          </span>
        </Link>
      </div>

      {/* Security & Bank/MoMo Verification Banner */}
      <SecurityAlertBanner onOpenPayoutModal={() => setPayoutModalOpen(true)} />

      {/* Real-time KPI Cards Grid */}
      <ProviderKpiGrid />

      {/* Primary Operational Modules Action Cards */}
      <OperationalActionCards onOpenPayoutModal={() => setPayoutModalOpen(true)} />

      {/* Peak Hours Utilization Heatmap */}
      <PeakHoursHeatmap />

      {/* 2-Column Analytics & Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopEmployersCard />
        <RecentActivityFeed />
      </div>

      {/* Modals */}
      <PayoutAccountModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        onSuccess={() => handleRefresh()}
      />
    </div>
  );
}
