"use client";

import React, { useState } from "react";
import {
  Calendar,
  Download,
  Share2,
  Bell,
  Menu,
  CheckCircle2,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CorporateHeaderProps {
  onOpenMobileMenu?: () => void;
  selectedRange?: string;
  onRangeChange?: (range: string) => void;
  organizationName?: string;
  organizationSlug?: string;
  totalEligible?: number;
  onDownloadCensus?: () => void;
}

const DATE_RANGES = [
  { id: "30d", label: "Last 30 Days" },
  { id: "month", label: "This Month (Sep 2026)" },
  { id: "90d", label: "Last 90 Days" },
  { id: "ytd", label: "Year to Date (2026)" },
];

export function CorporateHeader({
  onOpenMobileMenu,
  selectedRange = "30d",
  onRangeChange,
  organizationName = "TechCorp Rwanda",
  organizationSlug = "techcorp-rwanda",
  totalEligible = 1200,
  onDownloadCensus,
}: CorporateHeaderProps) {
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${organizationSlug}`
    : `https://polyfit.onrender.com/join/${organizationSlug}`;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const currentRangeLabel =
    DATE_RANGES.find((r) => r.id === selectedRange)?.label || "Last 30 Days";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 px-6 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#0B1F33]">
              Workforce Wellness Overview
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E9FAF2] text-[#28D17C] border border-[#28D17C]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C] animate-pulse" />
              Live Network
            </span>
          </div>
          <p className="text-xs text-[#526173]">
            Managing health benefit eligibility and verified visits for{" "}
            <span className="font-semibold text-[#0B1F33]">{organizationName}</span>
          </p>
        </div>
      </div>

      {/* Right: Actions, Filters & Controls */}
      <div className="flex items-center gap-2.5">
        {/* Date Range Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setIsRangeOpen(!isRangeOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] hover:bg-white text-xs font-semibold text-[#0B1F33] transition-all shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-[#526173]" />
            <span className="hidden md:inline">{currentRangeLabel}</span>
            <span className="md:hidden">30D</span>
            <ChevronDown
              className={cn("w-3.5 h-3.5 text-[#8491A3] transition-transform", isRangeOpen && "rotate-180")}
            />
          </button>

          {isRangeOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-1.5 z-40 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="text-[10px] font-semibold text-[#8491A3] uppercase px-2 py-1">
                Reporting Period
              </div>
              {DATE_RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onRangeChange?.(r.id);
                    setIsRangeOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between",
                    selectedRange === r.id
                      ? "bg-[#E9FAF2] text-[#0B1F33] font-semibold"
                      : "text-[#526173] hover:bg-[#F1F4F8] hover:text-[#0B1F33]"
                  )}
                >
                  <span>{r.label}</span>
                  {selectedRange === r.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1-Click "Download Census" Button (RFC 4180 standard for HR) */}
        <button
          onClick={onDownloadCensus}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F7F9FC] text-xs font-semibold text-[#0B1F33] transition-colors shadow-2xs group"
          title="Export current employee roster and tier eligibility as CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#00D2B4] group-hover:scale-110 transition-transform" />
          <span>Download Census</span>
        </button>

        {/* 1-Click "Copy Join Link" Trigger */}
        <button
          onClick={handleCopyLink}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs",
            copiedLink
              ? "bg-[#28D17C] text-[#0B1F33]"
              : "bg-[#0B1F33] hover:bg-[#142C44] text-white"
          )}
        >
          {copiedLink ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0B1F33]" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-[#28D17C]" />
              <span className="hidden md:inline">Share Join Link</span>
              <span className="md:hidden">Share</span>
            </>
          )}
        </button>

        {/* Notifications Icon with popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotification(!showNotification)}
            className="p-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F7F9FC] text-[#526173] hover:text-[#0B1F33] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#28D17C] ring-2 ring-white" />
          </button>

          {showNotification && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-4 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h4 className="text-sm font-bold text-[#0B1F33]">Corporate Notifications</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E9FAF2] text-[#28D17C]">
                  1 New
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="p-2.5 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0B1F33] mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#28D17C]" />
                    <span>Monthly Tax Invoice Ready</span>
                  </div>
                  <p className="text-[#526173] leading-relaxed text-[11px]">
                    Your RRA EBM-compliant 18% VAT invoice for August 2026 has been generated and validated.
                  </p>
                  <div className="mt-2 text-[10px] text-[#8491A3]">2 hours ago</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
