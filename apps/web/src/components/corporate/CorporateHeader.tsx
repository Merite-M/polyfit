"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Share2,
  Bell,
  Menu,
  CheckCircle2,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCorporate } from "@/contexts/CorporateContext";

interface CorporateHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const DATE_RANGES = [
  { id: "30d", label: "Last 30 Days" },
  { id: "month", label: "This Month (Oct 2026)" },
  { id: "90d", label: "Last 90 Days" },
  { id: "ytd", label: "Year to Date (2026)" },
];

export function CorporateHeader({
  title,
  subtitle,
  actions,
}: CorporateHeaderProps) {
  const pathname = usePathname();
  const {
    organization,
    selectedRange,
    setSelectedRange,
    toggleMobileMenu,
    downloadCensusCsv,
    copyInviteLink,
    funnelData,
  } = useCorporate();

  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Dynamic route context when title/subtitle are not explicitly passed
  const routeMeta = React.useMemo(() => {
    if (pathname === "/corporate/employees") {
      return {
        defaultTitle: "Employee Census & Roster",
        defaultSubtitle: `Managing ${funnelData.totalEligible || 1200} covered staff members for ${organization.name}`,
        badge: "Roster Management",
      };
    }
    if (pathname === "/corporate/plans") {
      return {
        defaultTitle: "Corporate Benefit Plans",
        defaultSubtitle: `Configuring wellness subsidy policies and visit quotas for ${organization.name}`,
        badge: "Plan Matrix",
      };
    }
    if (pathname === "/corporate/billing") {
      return {
        defaultTitle: "Consolidated Billing & Tax Invoices",
        defaultSubtitle: `RRA EBM-compliant 18% VAT invoicing and verified visit audit trails for ${organization.name}`,
        badge: "Tax EBM",
      };
    }
    if (pathname === "/corporate/settings") {
      return {
        defaultTitle: "Organization Settings",
        defaultSubtitle: `Authorized corporate domains and security configurations for ${organization.name}`,
        badge: "Enterprise Security",
      };
    }
    return {
      defaultTitle: "Workforce Wellness Overview",
      defaultSubtitle: `Real-time health benefit eligibility and verified visits for ${organization.name}`,
      badge: "Live Network",
    };
  }, [pathname, organization.name, funnelData.totalEligible]);

  const activeTitle = title || routeMeta.defaultTitle;
  const activeSubtitle = subtitle || routeMeta.defaultSubtitle;

  const handleCopyLink = () => {
    copyInviteLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentRangeLabel =
    DATE_RANGES.find((r) => r.id === selectedRange)?.label || "Last 30 Days";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between min-h-[4.5rem] px-4 sm:px-6 bg-card/95 backdrop-blur-md border-b border-border transition-colors">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted transition-colors flex-shrink-0"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
              {activeTitle}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {routeMeta.badge}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate hidden xs:block">
            {activeSubtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions, Filters & Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* Custom Actions Slot (e.g. Add Employee, Create Plan) */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Date Range Selector Pill (hidden on xs mobile to prevent header overflow) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setIsRangeOpen(!isRangeOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted/50 text-xs font-semibold text-foreground transition-all shadow-2xs"
            aria-label="Select reporting date range"
          >
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden md:inline">{currentRangeLabel}</span>
            <span className="md:hidden text-[11px]">Period</span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground transition-transform duration-150",
                isRangeOpen && "rotate-180"
              )}
            />
          </button>

          {isRangeOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-card rounded-xl shadow-xl border border-border p-1.5 z-40 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                Reporting Period
              </div>
              {DATE_RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRange(r.id);
                    setIsRangeOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between",
                    selectedRange === r.id
                      ? "bg-emerald-500/10 text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{r.label}</span>
                  {selectedRange === r.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1-Click "Download Census" Button (RFC 4180 standard for HR) */}
        <button
          onClick={downloadCensusCsv}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs group"
          title="Export active employee roster and tier eligibility as RFC 4180 CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-500 group-hover:scale-110 transition-transform" />
          <span className="hidden lg:inline">Download Census</span>
          <span className="lg:hidden">Census</span>
        </button>

        {/* 1-Click "Copy Join Link" Trigger */}
        <button
          onClick={handleCopyLink}
          className={cn(
            "hidden sm:flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs",
            copiedLink
              ? "bg-emerald-500 text-slate-900"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          title="Share company employee registration link"
        >
          {copiedLink ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Share Join Link</span>
              <span className="md:hidden">Share</span>
            </>
          )}
        </button>

        {/* Notifications Icon with popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotification(!showNotification)}
            className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
            aria-label="Platform Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
          </button>

          {showNotification && (
            <div className="absolute right-0 mt-1.5 w-80 bg-card rounded-2xl shadow-xl border border-border p-3 z-40 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <span className="text-xs font-bold text-foreground">Notifications</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  All Systems Normal
                </span>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="p-2 rounded-xl bg-muted/50 border border-border/50">
                  <p className="font-semibold text-foreground text-[11px]">
                    Verified Visit Validation Active
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    TOTP anti-passback and RRA EBM 18% VAT invoicing operating across 156 provider locations.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-muted/50 border border-border/50">
                  <p className="font-semibold text-foreground text-[11px]">
                    Monthly Settlement Status
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Current billing cycle invoices ready for export under RRA electronic fiscal rules.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
