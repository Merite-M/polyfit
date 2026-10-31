"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid,
  Globe,
  Building2,
  Dumbbell,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformSuiteLauncherProps {
  className?: string;
  variant?: "dark" | "light" | "auto";
  onOpenMobilePreview?: () => void;
}

export function PlatformSuiteLauncher({
  className,
  variant = "auto",
  onOpenMobilePreview,
}: PlatformSuiteLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on outside click & handle Escape key navigation
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const portals = [
    {
      id: "website",
      name: "Public Website",
      category: "Marketing & Network",
      href: "/",
      icon: Globe,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      description: "Landing, pricing matrix, lead capture & Kigali venue discovery map",
      isActive:
        pathname === "/" ||
        pathname.startsWith("/pricing") ||
        pathname.startsWith("/network") ||
        pathname.startsWith("/demo") ||
        pathname.startsWith("/join"),
    },
    {
      id: "corporate",
      name: "Corporate HR Portal",
      category: "Employer B2B",
      href: "/corporate",
      icon: Building2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "Employee census, benefit allocation, utilization & RRA EBM invoices",
      isActive: pathname.startsWith("/corporate"),
    },
    {
      id: "partner",
      name: "Partner Hub",
      category: "Wellness Providers",
      href: "/partner",
      icon: Dumbbell,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
      description: "Front-desk check-in stream, multi-branch setup & MoMo/bank payouts",
      isActive: pathname.startsWith("/partner"),
    },
    {
      id: "operations",
      name: "Super Admin Console",
      category: "PolyFit Operations",
      href: "/operations",
      icon: ShieldCheck,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      description: "Marketplace clearinghouse, Omnibar search, client onboarding & margins",
      isActive: pathname.startsWith("/operations"),
    },
  ];

  const activePortal =
    portals.find((p) => p.isActive) || portals[0];

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
          variant === "dark" || (variant === "auto" && (pathname === "/" || pathname.startsWith("/pricing") || pathname.startsWith("/network")))
            ? "bg-slate-800/80 hover:bg-slate-700/80 border-white/10 text-slate-200 hover:text-white shadow-2xs focus-visible:ring-offset-slate-900"
            : "bg-background/90 hover:bg-muted border-border text-foreground shadow-2xs focus-visible:ring-offset-background"
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="platform-suite-menu"
        aria-label="PolyFit Platform Suite switcher"
        title="Switch between PolyFit platform surfaces"
      >
        <Grid className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline font-bold">PolyFit Suite</span>
        <span className="sm:hidden font-bold">Suite</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <ChevronDown
          className={cn(
            "w-3 h-3 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="platform-suite-menu"
          className="absolute right-0 sm:left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150 text-slate-100"
          role="menu"
          aria-label="Platform suite portals"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Unified Platform Ecosystem
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Live Network
            </span>
          </div>

          {/* Core Portal Options */}
          <div className="py-1 space-y-1">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.id}
                  href={portal.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-xl transition-all group border focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
                    portal.isActive
                      ? "bg-slate-800/90 border-slate-700/80 shadow-xs"
                      : "border-transparent hover:bg-slate-800/50 hover:border-slate-800"
                  )}
                  role="menuitem"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105",
                      portal.color
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {portal.name}
                      </span>
                      {portal.isActive && (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {portal.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Interactive Mobile Pass Quick-Launcher */}
          <div className="mt-1 pt-2 border-t border-slate-800/80 px-2 pb-1">
            <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-800/60 border border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Employee Access Pass
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Expo 56 • Dynamic TOTP Pass
                  </div>
                </div>
              </div>

              {onOpenMobilePreview ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenMobilePreview();
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Preview Pass
                </button>
              ) : (
                <a
                  href="http://localhost:8085"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors inline-flex items-center gap-1 shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <span>Open App</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
