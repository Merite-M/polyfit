'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ScanLine,
  Receipt,
  BarChart3,
  Building2,
  SlidersHorizontal,
  FileText,
  ShieldAlert,
  HelpCircle,
  LogOut,
  Radio,
  ExternalLink,
  ChevronRight,
  Share2,
  Wand2
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { IsometricHexMark } from '@/components/ui/polyfit-logo';

interface PartnerSidebarProps {
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: React.ReactNode;
  subBadge?: string;
  section?: string;
}

export function PartnerSidebar({ onCloseMobile }: PartnerSidebarProps) {
  const pathname = usePathname();
  const { provider, todaySummary } = usePartner();

  const navSections = [
    {
      title: 'Operations',
      items: [
        {
          label: 'Check-in Terminal',
          href: '/partner/checkins',
          icon: ScanLine,
          badge: todaySummary?.pending_queue_count && todaySummary.pending_queue_count > 0 ? (
            <span className="px-1.5 py-0.5 text-[11px] font-bold bg-warning text-navy rounded-full animate-pulse">
              {todaySummary.pending_queue_count}
            </span>
          ) : null
        },
        {
          label: 'Home Overview',
          href: '/partner/dashboard',
          icon: LayoutDashboard
        }
      ]
    },
    {
      title: 'Facility & Brand',
      items: [
        {
          label: 'Facility & Locations',
          href: '/partner/locations',
          icon: Building2
        },
        {
          label: 'Marketing & Signs',
          href: '/partner/marketing',
          icon: Share2,
          badge: (
            <span className="text-[10px] font-bold bg-accent/20 text-accent px-1.5 py-0.2 rounded border border-accent/30">
              Plaques
            </span>
          )
        },
        {
          label: 'Facility Onboarding',
          href: '/partner/setup',
          icon: Wand2
        }
      ]
    },
    {
      title: 'Finance & Contracts',
      items: [
        {
          label: 'Finance & Payouts',
          href: '/partner/settlements',
          icon: Receipt
        },
        {
          label: 'Commercial Contracts',
          href: '/partner/partnership',
          icon: SlidersHorizontal,
          badge: (
            <span className="text-[10px] font-bold bg-accent-subtle text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
              Terms
            </span>
          )
        },
        {
          label: 'Reports & Attendance',
          href: '/partner/reports',
          icon: BarChart3
        }
      ]
    }
  ];

  return (
    <aside className="w-64 h-full bg-navy border-r border-border flex flex-col select-none text-white">
      {/* Brand Header */}
      <div className="p-5 border-b border-border">
        <Link
          href="/partner/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={onCloseMobile}
        >
          {/* Isometric Hex Logo Mark */}
          <IsometricHexMark size={32} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">PolyFit</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                Partner
              </span>
            </div>
            <p className="text-[11px] text-subdued font-medium leading-none mt-0.5">
              Operations Hub
            </p>
          </div>
        </Link>

        {/* Active Facility Chip */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-800 border border-border/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-accent/15 border border-accent/30 text-accent font-bold text-xs flex items-center justify-center shrink-0">
            {provider?.name ? provider.name.slice(0, 2).toUpperCase() : 'PF'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {provider?.name || 'FitLife Gym Kigali'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              <span className="text-[10px] text-subdued capitalize">
                {provider?.category || 'Wellness Provider'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/partner/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent text-navy font-semibold shadow-xs'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-navy' : 'text-subdued'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Desk Status */}
      <div className="p-3 border-t border-border space-y-2 bg-slate-950/60">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-[11px] font-medium text-slate-200">Front Desk</span>
          </div>
          <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Active</span>
        </div>

        <div className="px-2 py-1 flex items-center justify-between text-[11px] text-subdued">
          <span>Front Desk Station #1</span>
          <Link href="/terms" className="hover:text-white transition-colors flex items-center gap-1">
            Partner Terms <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
