"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Network, 
  Activity, 
  Coins, 
  ShieldCheck, 
  Radio, 
  ChevronRight,
  X,
  ExternalLink
} from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";

interface OperationsSidebarProps {
  onCloseMobile?: () => void;
}

const NAVIGATION_ITEMS = [
  {
    name: "Command Center",
    href: "/operations",
    icon: LayoutDashboard,
    badge: "LIVE",
    badgeVariant: "emerald" as const,
  },
  {
    name: "Corporate Clients",
    href: "/operations/clients",
    icon: Building2,
    badge: "LIVE",
    badgeVariant: "emerald" as const,
  },
  {
    name: "Provider Network",
    href: "/operations/providers",
    icon: Network,
    badge: "PF-119",
    badgeVariant: "slate" as const,
  },
  {
    name: "Live Visit Monitor",
    href: "/operations/visits",
    icon: Activity,
    badge: "PF-120",
    badgeVariant: "slate" as const,
  },
  {
    name: "Marketplace Finance",
    href: "/operations/finance",
    icon: Coins,
    badge: "PF-121",
    badgeVariant: "slate" as const,
  },
  {
    name: "User 360 & Security",
    href: "/operations/support",
    icon: ShieldCheck,
    badge: "PF-122",
    badgeVariant: "slate" as const,
  },
];

export function OperationsSidebar({ onCloseMobile }: OperationsSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full bg-[#0B1F33] text-white flex flex-col border-r border-[#21405A] select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#21405A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PolyFitLogo className="h-8 w-auto text-[#28D17C]" />
          <div>
            <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
              <span>PolyFit</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#28D17C]/20 text-[#28D17C] font-semibold border border-[#28D17C]/30">
                OPS
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Operations Console</div>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Real-time Gateway Node Status */}
      <div className="px-4 py-2.5 bg-[#071521] border-b border-[#21405A]/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28D17C] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28D17C]"></span>
          </span>
          <span className="text-slate-300 font-medium text-[11px]">Kigali Gateway Node</span>
        </div>
        <span className="font-mono text-[10px] text-[#00D2B4] font-semibold">ONLINE</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Super Admin Modules
        </div>
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/operations" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#142C44] text-[#28D17C] border-l-4 border-[#28D17C] pl-2 font-semibold shadow-sm"
                  : "text-slate-300 hover:bg-[#132D43] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-[#28D17C]" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badgeVariant === "emerald" ? (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30">
                    {item.badge}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-slate-300">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#28D17C]" />}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Switcher & Telemetry Box */}
      <div className="p-3 border-t border-[#21405A] space-y-2.5 bg-[#071521]/60">
        <div className="p-2.5 rounded-lg bg-[#0B1F33] border border-[#21405A] text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-semibold">Platform SLA</span>
            <span className="font-mono text-[#28D17C] font-bold">99.94%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#28D17C] h-full w-[99.94%]" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Avg Response</span>
            <span className="font-mono text-slate-300">142ms</span>
          </div>
        </div>

        {/* Portal Switcher Shortcut */}
        <Link
          href="/corporate"
          className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <span className="text-[11px]">View Employer Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
