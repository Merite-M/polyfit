"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IsometricHexMark } from "@/components/ui/polyfit-logo";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Layers,
  ReceiptText,
  Settings,
  ChevronDown,
  Building2,
  ExternalLink,
  Sparkles,
  LogOut,
  HelpCircle,
  Share2,
  Check,
  CheckCircle2,
  X,
} from "lucide-react";

interface CorporateSidebarProps {
  organizationName?: string;
  organizationSlug?: string;
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
  organizationName = "TechCorp Rwanda",
  organizationSlug = "techcorp-rwanda",
  className,
  onCloseMobile,
}: CorporateSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isDemoMode, enableDemoMode } = useAuth();
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

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${organizationSlug}`
    : `https://polyfit.onrender.com/join/${organizationSlug}`;

  const handleCopyInviteLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[#0B1F33] text-white border-r border-[#1B354F] select-none",
        className
      )}
    >
      {/* Brand & Organization Selector */}
      <div className="p-5 border-b border-[#1B354F]">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/corporate"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D17C] rounded-lg"
          >
            <IsometricHexMark size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">PolyFit</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30">
                  Corporate
                </span>
              </div>
              <p className="text-xs text-[#8491A3]">Wellness Network</p>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#8491A3] hover:text-white hover:bg-[#132D43]"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Employer Organization Switcher Card */}
        <div className="relative">
          <button
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#132D43]/90 hover:bg-[#132D43] border border-[#21405A] transition-all text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#28D17C] to-[#00D2B4] flex items-center justify-center text-[#0B1F33] font-bold text-sm shadow-sm flex-shrink-0">
                {organizationName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-[#28D17C] transition-colors">
                  {organizationName}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#8491A3]">
                  <Building2 className="w-3 h-3 text-[#00D2B4]" />
                  <span>Enterprise Plan</span>
                </div>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[#8491A3] transition-transform duration-200",
                isOrgDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {/* Org Switcher Dropdown */}
          {isOrgDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0D2235] border border-[#21405A] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="text-[11px] font-semibold text-[#8491A3] uppercase px-2 py-1">
                Active Organization
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#142C44] text-white text-xs font-medium">
                <div className="truncate">
                  <p className="font-semibold text-[#28D17C]">{organizationName}</p>
                  <p className="text-[10px] text-[#8491A3]">Allowed: @{organizationSlug.replace(/-.*/, '')}.rw</p>
                </div>
                <Check className="w-4 h-4 text-[#28D17C]" />
              </div>
              <div className="mt-1 pt-1 border-t border-[#21405A]/60">
                <Link
                  href="/corporate/settings"
                  onClick={() => setIsOrgDropdownOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg text-xs text-[#8491A3] hover:text-white hover:bg-[#142C44] transition-colors"
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
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-[#8491A3]">
          Platform
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
                  : "text-[#DAE9E2] hover:bg-[#142C44] hover:text-white"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent"
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
                      : "bg-[#142C44] text-secondary border border-[#21405A]"
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
      <div className="p-3 mx-3 mb-3 rounded-xl bg-gradient-to-b from-[#142C44] to-[#0D2235] border border-[#21405A]">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-[#B8F36B]" />
          <span className="text-xs font-semibold text-white">Employee Join Link</span>
        </div>
        <p className="text-[11px] text-[#8491A3] mb-2 leading-relaxed">
          Share with your staff on Slack/Teams for instant mobile registration.
        </p>
        <button
          onClick={handleCopyInviteLink}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
            copiedLink
              ? "bg-[#28D17C] text-[#0B1F33]"
              : "bg-[#21405A] hover:bg-[#28D17C] hover:text-[#0B1F33] text-white"
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
      <div className="p-3 border-t border-[#1B354F] bg-[#071521]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#142C44] border border-[#21405A] flex items-center justify-center text-xs font-bold text-[#28D17C]">
              {user?.email ? user.email.substring(0, 2).toUpperCase() : "HR"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "HR Administrator"}
              </p>
              <p className="text-[10px] text-[#8491A3] truncate">
                {user?.email || "hr@techcorp.rw"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/demo"
              className="p-1.5 rounded-lg text-[#8491A3] hover:text-white hover:bg-[#142C44] transition-colors"
              title="Help & Documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
            <button
              onClick={() => signOut?.()}
              className="p-1.5 rounded-lg text-[#8491A3] hover:text-[#EF4444] hover:bg-[#142C44] transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isDemoMode && (
          <div className="mt-2 text-center py-1 rounded bg-[#B8F36B]/10 text-[#B8F36B] border border-[#B8F36B]/20 text-[10px] font-semibold">
            Corporate Demo Mode Active
          </div>
        )}
      </div>
    </aside>
  );
}
