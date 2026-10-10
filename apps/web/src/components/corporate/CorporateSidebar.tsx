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
  ChevronDown,
  Building2,
  Sparkles,
  LogOut,
  HelpCircle,
  Share2,
  Check,
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
    availableOrganizations,
    switchOrganization,
    copyInviteLink,
  } = useCorporate();

  const [copiedLink, setCopiedLink] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

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
            href="/corporate"
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

        {/* Dynamic Employer Organization Switcher Card */}
        <div className="relative">
          <button
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all text-left group"
            aria-expanded={isOrgDropdownOpen}
            aria-label="Switch organization"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-slate-900 font-bold text-sm shadow-xs flex-shrink-0">
                {organization.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {organization.name}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Building2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
                  <span className="truncate">Enterprise Corporate</span>
                </div>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0",
                isOrgDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {/* Org Switcher Dropdown (Multi-Org Switcher) */}
          {isOrgDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 py-1">
                Select Employer Network
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {availableOrganizations.map((org) => {
                  const isSelected = org.id === organization.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrganization(org.id);
                        setIsOrgDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg text-left text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-slate-800 text-white"
                          : "hover:bg-slate-800/60 text-slate-400 hover:text-white"
                      )}
                    >
                      <div className="truncate">
                        <p className={cn("font-semibold", isSelected && "text-emerald-400")}>
                          {org.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">@{org.domain}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 pt-1 border-t border-slate-700/60">
                <Link
                  href="/corporate/settings"
                  onClick={() => setIsOrgDropdownOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Manage Organization Profile</span>
                </Link>
              </div>
            </div>
          )}
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
              href={item.href}
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
          Share with your staff on Slack/Teams for instant mobile registration.
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
