"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IsometricHexMark } from "@/components/ui/polyfit-logo";
import { useAuth } from "@/contexts/AuthContext";
import { useCorporate } from "@/contexts/CorporateContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Layers,
  ReceiptText,
  Settings,
  Building2,
  Sparkles,
  LogOut,
  HelpCircle,
  Share2,
  CheckCircle2,
  X,
} from "lucide-react";

interface CorporateSidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

const NAVIGATION_ITEMS = [
  {
    name: "Overview",
    href: "/corporate",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Employees & Roster",
    href: "/corporate/employees",
    icon: Users,
    badge: "Census",
  },
  {
    name: "Benefit Plans",
    href: "/corporate/plans",
    icon: Layers,
    badge: null,
  },
  {
    name: "Billing & Invoices",
    href: "/corporate/billing",
    icon: ReceiptText,
    badge: "Tax EBM",
  },
  {
    name: "Settings & Domains",
    href: "/corporate/settings",
    icon: Settings,
    badge: null,
  },
];

export function CorporateSidebar({
  className,
  onCloseMobile,
}: CorporateSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isDemoMode } = useAuth();
  const {
    organization,
    copyInviteLink,
    getOrgHref,
  } = useCorporate();

  const [copiedLink, setCopiedLink] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) => {
    onCloseMobile?.();
    const destination = getOrgHref(targetPath);
    if (pathname === targetPath) return;
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      e.preventDefault();
      (document as any).startViewTransition(() => {
        router.push(destination);
      });
    }
  };

  const handleCopyInviteLink = (e: React.MouseEvent) => {
    e.preventDefault();
    copyInviteLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[#0B1F33] text-white border-r border-[#1B354F] select-none",
        className
      )}
    >
      {/* Brand & Header Section */}
      <div className="p-5 border-b border-[#1B354F]">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={getOrgHref("/corporate")}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg"
          >
            <IsometricHexMark size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">PolyFit</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Corporate
                </span>
              </div>
              <p className="text-xs text-slate-400">Wellness Network</p>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Active Employer Organization Identity Card */}
        <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-slate-900 font-bold text-sm shadow-xs flex-shrink-0">
              {organization.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {organization.name}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Building2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
                <span className="truncate">@{organization.domain}</span>
              </div>
            </div>
          </div>
          <Link
            href={getOrgHref("/corporate/settings")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors flex-shrink-0"
            title="Manage Company Settings"
            aria-label="Manage Company Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Platform Workspace
        </div>

        {NAVIGATION_ITEMS.map((item) => {
          const isActive =
            item.href === "/corporate"
              ? pathname === "/corporate"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={getOrgHref(item.href)}
              onClick={(e) => handleNavClick(e, item.href)}
              style={isActive ? { viewTransitionName: "corporate-active-pill" } : undefined}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative",
                isActive
                  ? "bg-accent text-accent-foreground font-semibold shadow-xs shadow-accent/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-accent-foreground" : "text-slate-400 group-hover:text-emerald-400"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide",
                    isActive
                      ? "bg-primary text-accent"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Invite Link Callout (Wellhub "Make Signup a Snap" Hook) */}
      <div className="p-3 mx-3 mb-3 rounded-xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white">Employee Join Link</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
          Share with your staff on WhatsApp or Corporate Email for instant mobile registration.
        </p>
        <button
          onClick={handleCopyInviteLink}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
            copiedLink
              ? "bg-emerald-500 text-slate-900"
              : "bg-slate-700 hover:bg-emerald-500 hover:text-slate-900 text-white"
          )}
        >
          {copiedLink ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Join Link</span>
            </>
          )}
        </button>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-[#1B354F] bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
              {organization.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.user_metadata?.full_name || organization.contact_email?.split("@")[0] || "HR Administrator"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {organization.contact_email || `hr@${organization.domain}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              href="/demo"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Help & Documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
            <button
              onClick={() => signOut?.()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isDemoMode && (
          <div className="mt-2 text-center py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
            Corporate Network Active
          </div>
        )}
      </div>
    </aside>
  );
}
