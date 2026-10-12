'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ChevronDown,
  PlusCircle,
  ClockAlert,
  Menu,
  CheckCircle2,
  RefreshCw,
  Search,
  ScanLine,
  ArrowRight
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { FacilityUnitsModal } from './FacilityUnitsModal';

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
  const pathname = usePathname();
  const isCheckinPage = pathname === '/partner/checkins';
  const { locations, selectedLocationId, setSelectedLocationId, selectedLocation, todaySummary, refreshSummary } = usePartner();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [unitsModalOpen, setUnitsModalOpen] = React.useState(false);

  // Keyboard shortcut listener: Press 'm' or 'M' to trigger Manual Check-in when on checkins page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'm' || e.key === 'M') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        if (isCheckinPage) {
          e.preventDefault();
          onOpenManualCheckin();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckinPage, onOpenManualCheckin]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshSummary();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const pendingCount = todaySummary?.pending_queue_count || 0;

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

        {/* Multi-Branch Location Switcher Button & Drawer Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnitsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F9FC] hover:bg-[#F1F4F8] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all text-left group"
            title="Click to switch active facility unit or view all locations"
          >
            <div className="w-6 h-6 rounded-md bg-[#28D17C]/15 text-[#008A4B] flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 max-w-[150px] sm:max-w-[240px] truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0B1F33] truncate">
                  {selectedLocation ? selectedLocation.name : 'All Facilities'}
                </span>
                <span className="text-[10px] font-mono text-[#526173] bg-white px-1.5 py-0.2 rounded border border-[#E2E8F0] shrink-0 hidden sm:inline">
                  {selectedLocation ? (selectedLocation.name.includes('#') ? selectedLocation.name.split('#')[1]?.replace(')', '') : 'Unit #851931') : `${locations.length} Units`}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8491A3] group-hover:text-[#0B1F33] transition-colors shrink-0 ml-0.5" />
          </button>
        </div>
      </div>

      <FacilityUnitsModal
        isOpen={unitsModalOpen}
        onClose={() => setUnitsModalOpen(false)}
      />

      {/* Right: Telemetry & Contextual Actions */}
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

        {/* If on Check-ins page: Render fast Counter Manual Check-in with hotkey badge */}
        {isCheckinPage ? (
          <button
            onClick={onOpenManualCheckin}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-bold shadow-xs transition-all active:scale-98"
            title="Press 'M' on your keyboard anytime to open Manual Check-in"
          >
            <PlusCircle className="w-4 h-4 text-[#0B1F33]" />
            <span>Manual Check-in</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#0B1F33]/15 text-[#0B1F33] rounded">
              M
            </kbd>
          </button>
        ) : (
          /* If on other pages (Dashboard, Finance, Setup): If there are pending arrivals, show sleek link */
          pendingCount > 0 && (
            <Link
              href="/partner/checkins"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#B45309] border border-[#F59E0B]/30 text-xs font-bold transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
              <span>Arriving Visitors ({pendingCount})</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          )
        )}
      </div>
    </header>
  );
}
