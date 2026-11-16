"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Layers,
  Network, 
  Activity, 
  Coins, 
  ShieldCheck, 
  Radio, 
  ChevronRight,
  X,
  ExternalLink,
  Server
} from "lucide-react";
import { IsometricHexMark } from "@/components/ui/polyfit-logo";

interface OperationsSidebarProps {
  onCloseMobile?: () => void;
}

const NAVIGATION_ITEMS = [
  {
    name: "Command Center",
    href: "/operations",
    icon: LayoutDashboard,
    badge: "Master",
  },
  {
    name: "Corporate Clients",
    href: "/operations/clients",
    icon: Building2,
    badge: "Leads",
  },
  {
    name: "Partner Network",
    href: "/operations/providers",
    icon: Network,
    badge: "Fleet",
  },
  {
    name: "Visits & Disputes",
    href: "/operations/visits",
    icon: Activity,
    badge: "Live",
  },
  {
    name: "Finance & Clearing",
    href: "/operations/finance",
    icon: Coins,
    badge: "EBM",
  },
  {
    name: "Benefit Plans",
    href: "/operations/plans",
    icon: Layers,
    badge: "Rules",
  },
  {
    name: "Staff & Support",
    href: "/operations/support",
    icon: ShieldCheck,
    badge: "RBAC",
  },
];

export function OperationsSidebar({ onCloseMobile }: OperationsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    onCloseMobile?.();
    if (pathname === href) return;
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      e.preventDefault();
      (document as any).startViewTransition(() => {
        router.push(href);
      });
    }
  };

  return (
    <aside className="w-64 h-full bg-[#0B1F33] text-white flex flex-col border-r border-[#1B354F] select-none">
      {/* Brand & Header Section */}
      <div className="p-5 border-b border-[#1B354F]">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/operations"
            onClick={(e) => handleNavClick(e, "/operations")}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg"
          >
            <IsometricHexMark size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">PolyFit</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Operations
                </span>
              </div>
              <p className="text-xs text-slate-400">Super Admin Console</p>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Kigali Gateway Infrastructure Node Card */}
        <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-slate-900 font-bold text-xs shadow-xs shrink-0">
              <Server className="w-4 h-4 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28D17C] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28D17C]"></span>
                </span>
                <p className="text-xs font-semibold text-white truncate">
                  Kigali Gateway Node
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                <span className="font-mono text-emerald-400 font-semibold">KG-OPS-01</span>
                <span>•</span>
                <span className="text-emerald-400/90 font-medium">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Platform Clearinghouse
        </div>

        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/operations" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              style={isActive ? { viewTransitionName: "operations-active-pill" } : undefined}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative ${
                isActive
                  ? "bg-[#28D17C] text-slate-950 font-bold shadow-md shadow-emerald-500/15"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 transition-colors shrink-0 ${
                    isActive ? "text-slate-950" : "text-slate-400 group-hover:text-emerald-400"
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>

              {isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              ) : item.badge ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium tracking-wide bg-slate-800/80 text-slate-400 group-hover:text-slate-200 border border-slate-700/60">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Switcher & Telemetry Box */}
      <div className="p-3 border-t border-[#1B354F] space-y-2 bg-[#071521]/70">
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Platform SLA</span>
            <span className="font-mono text-emerald-400 font-bold">99.94%</span>
          </div>
          <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#28D17C] h-full w-[99.94%] rounded-full shadow-xs shadow-emerald-400/50" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Avg Round-Trip</span>
            <span className="font-mono text-slate-300">142ms</span>
          </div>
        </div>

        {/* Portal Switcher Shortcuts */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Link
            href="/corporate"
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50"
          >
            <span>Employer</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
          <Link
            href="/partner"
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50"
          >
            <span>Partner</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

