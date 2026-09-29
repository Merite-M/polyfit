'use client';

import React from 'react';
import {
  Building2,
  ChevronDown,
  PlusCircle,
  ClockAlert,
  Menu,
  CheckCircle2,
  RefreshCw,
  Search
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

interface PartnerHeaderProps {
  onOpenManualCheckin: () => void;
  onOpenRetroactiveClaim: () => void;
  onToggleMobileMenu: () => void;
}

export function PartnerHeader({
  onOpenManualCheckin,
  onOpenRetroactiveClaim,
  onToggleMobileMenu
}: PartnerHeaderProps) {
  const { locations, selectedLocationId, setSelectedLocationId, selectedLocation, refreshSummary } = usePartner();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshSummary();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Location Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#526173] hover:text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Multi-Branch Location Switcher Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#8491A3] hidden sm:inline uppercase tracking-wider">
              Facility:
            </span>
            <div className="relative inline-block">
              <select
                id="partner-location-select"
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="appearance-none bg-[#F7F9FC] hover:bg-[#F1F4F8] text-[#0B1F33] font-semibold text-xs md:text-sm pl-3 pr-8 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#28D17C] cursor-pointer transition-colors max-w-[220px] sm:max-w-[320px] truncate"
              >
                <option value="all">All Locations (Network View)</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.city ? `• ${loc.city}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8491A3] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Cloud Sync Telemetry & Counter Action CTAs */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Cloud Sync Pulse */}
        <button
          onClick={handleManualRefresh}
          title="Click to refresh live feed"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F7F9FC] border border-[#E2E8F0] text-xs font-medium text-[#526173] hover:bg-[#F1F4F8] transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28D17C] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28D17C]"></span>
          </span>
          <span className="text-[11px] font-mono text-[#0B1F33]">Cloud Sync: Live</span>
          <RefreshCw className={`w-3 h-3 text-[#8491A3] ml-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Retroactive Claim Button */}
        <button
          onClick={onOpenRetroactiveClaim}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F7F9FC] hover:bg-[#F1F4F8] text-[#0B1F33] text-xs font-semibold border border-[#E2E8F0] transition-colors"
        >
          <ClockAlert className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Missed Check-in</span>
        </button>

        {/* Manual Backup Check-in CTA */}
        <button
          onClick={onOpenManualCheckin}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-bold shadow-xs transition-all active:scale-98"
        >
          <PlusCircle className="w-4 h-4 text-[#0B1F33]" />
          <span>Manual Check-in</span>
        </button>
      </div>
    </header>
  );
}
