'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ScanLine,
  Receipt,
  BarChart3,
  Building2,
  SlidersHorizontal,
  ShieldAlert,
  HelpCircle,
  LogOut,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

interface PartnerSidebarProps {
  onCloseMobile?: () => void;
}

export function PartnerSidebar({ onCloseMobile }: PartnerSidebarProps) {
  const pathname = usePathname();
  const { provider, todaySummary } = usePartner();

  const navItems = [
    {
      label: 'Check-in Operations',
      href: '/partner/checkins',
      icon: ScanLine,
      badge: todaySummary?.pending_queue_count && todaySummary.pending_queue_count > 0 ? (
        <span className="px-1.5 py-0.5 text-[11px] font-bold bg-[#F59E0B] text-[#0B1F33] rounded-full animate-pulse">
          {todaySummary.pending_queue_count}
        </span>
      ) : null
    },
    {
      label: 'Finance & Payouts',
      href: '/partner/settlements',
      icon: Receipt
    },
    {
      label: 'Reports & Audit',
      href: '/partner/reports',
      icon: BarChart3,
      badge: (
        <span className="text-[10px] font-bold bg-[#E9FAF2] text-[#008A4B] px-1.5 py-0.5 rounded-full border border-[#B7F1D2]">
          4-Tab
        </span>
      )
    },
    {
      label: 'Facility & Locations',
      href: '/partner/locations',
      icon: Building2,
      badge: (
        <span className="text-[10px] font-bold bg-[#E9FAF2] text-[#008A4B] px-1.5 py-0.5 rounded-full border border-[#B7F1D2]">
          Setup
        </span>
      )
    },
    {
      label: 'Partnership Hub',
      href: '/partner/dashboard',
      icon: SlidersHorizontal,
      subBadge: 'PF-96'
    }
  ];

  return (
    <aside className="w-64 h-full bg-[#0B1F33] border-r border-[#21405A] flex flex-col select-none text-white">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#21405A]">
        <Link
          href="/partner/checkins"
          className="flex items-center gap-2.5 group"
          onClick={onCloseMobile}
        >
          {/* Isometric Hex Logo Mark */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#28D17C] to-[#00D2B4] flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B1F33"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
              <path d="M12 22V12" />
              <path d="M12 12l8.5-5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">PolyFit</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30">
                Partner
              </span>
            </div>
            <p className="text-[11px] text-[#8491A3] font-medium leading-none mt-0.5">
              Operations Hub
            </p>
          </div>
        </Link>

        {/* Active Facility Chip */}
        <div className="mt-4 p-2.5 rounded-lg bg-[#132D43] border border-[#21405A]/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#28D17C]/15 border border-[#28D17C]/30 text-[#28D17C] font-bold text-xs flex items-center justify-center shrink-0">
            {provider?.name ? provider.name.slice(0, 2).toUpperCase() : 'PF'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {provider?.name || 'FitLife Gym Kigali'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]"></span>
              <span className="text-[10px] text-[#8491A3] capitalize">
                {provider?.category || 'Wellness Provider'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-[#8491A3] uppercase tracking-wider">
          Operations
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/partner/checkins' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#28D17C] text-[#0B1F33] font-semibold shadow-xs'
                  : 'text-[#E0E3E6] hover:bg-[#132D43] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B1F33]' : 'text-[#8491A3]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge}
              {item.subBadge && !isActive && (
                <span className="text-[9px] font-semibold text-[#8491A3] bg-[#071521] px-1.5 py-0.5 rounded border border-[#21405A]">
                  {item.subBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / System Telemetry */}
      <div className="p-3 border-t border-[#21405A] space-y-2 bg-[#071521]/60">
        {/* Scanner Relay Telemetry */}
        <div className="p-2.5 rounded-lg bg-[#132D43]/60 border border-[#21405A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28D17C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28D17C]"></span>
            </span>
            <span className="text-[11px] font-medium text-[#E0E3E6]">Cloud Relay</span>
          </div>
          <span className="text-[10px] font-mono text-[#28D17C] font-semibold">ONLINE</span>
        </div>

        <div className="px-2 py-1 flex items-center justify-between text-[11px] text-[#8491A3]">
          <span>Counter Kiosk #01</span>
          <Link href="/terms" className="hover:text-white transition-colors flex items-center gap-1">
            Rules <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
