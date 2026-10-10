"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, Menu, Clock, Shield, Bell, CheckCircle2, Zap } from "lucide-react";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";

interface OperationsHeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenOmnibar?: () => void;
}

export function OperationsHeader({ onOpenMobileMenu, onOpenOmnibar }: OperationsHeaderProps) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>("");
  const { openBypassModal } = useOperationsDrawer();

  const getSectionName = () => {
    if (pathname?.includes("/operations/support")) return "User 360 & Security";
    if (pathname?.includes("/operations/clients")) return "Corporate Clients";
    if (pathname?.includes("/operations/providers")) return "Provider Network";
    if (pathname?.includes("/operations/visits")) return "Live Visit Monitor";
    if (pathname?.includes("/operations/finance")) return "Marketplace Finance";
    return "Command Center";
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Format Central Africa Time (CAT / Kigali UTC+2)
      const formatted = now.toLocaleTimeString("en-GB", {
        timeZone: "Africa/Kigali",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setCurrentTime(`${formatted} CAT`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-3 sm:px-4 lg:px-6 flex items-center justify-between z-20 sticky top-0 shadow-xs">
      {/* Left: Mobile Menu Trigger & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          <span className="hidden sm:inline font-semibold text-slate-500">PolyFit</span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="hidden md:inline font-semibold text-[#0B1F33]">Operations</span>
          <span className="hidden md:inline text-slate-300">/</span>
          <span className="font-semibold text-[#008A4B] bg-[#E9FAF2] px-2.5 py-0.5 rounded-full border border-[#B7F1D2] text-[11px] truncate max-w-[140px] sm:max-w-none">
            {getSectionName()}
          </span>
        </div>
      </div>

      {/* Center: Universal Omnibar Trigger (Keyboard First) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <button
          onClick={onOpenOmnibar}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-xs text-slate-500 transition-all shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-slate-600 font-medium">
              Search employers, providers, visits, invoices...
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
            <kbd className="font-sans">⌘</kbd>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Emergency Bypass, Live Clock & Admin User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Emergency Bypass Action */}
        <button
          onClick={() => openBypassModal()}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#008A4B] hover:bg-[#00703C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title="Emergency Turnstile Bypass Pass"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span className="hidden sm:inline">Emergency Pass</span>
        </button>

        {/* Mobile Search Button */}
        <button
          onClick={onOpenOmnibar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Live Kigali Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || "--:--:-- CAT"}</span>
        </div>

        {/* Network Status Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E9FAF2] border border-[#B7F1D2] text-[#008A4B] text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#008A4B]" />
          <span>Network Nominal</span>
        </div>

        {/* Admin Avatar & Role */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#0B1F33] text-white flex items-center justify-center text-xs font-bold font-mono">
            SA
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-[#0B1F33] leading-tight">Super Admin</div>
            <div className="text-[10px] text-slate-500 font-mono">ops@polyfit.rw</div>
          </div>
        </div>
      </div>
    </header>
  );
}
