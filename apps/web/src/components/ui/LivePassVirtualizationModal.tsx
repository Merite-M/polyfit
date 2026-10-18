"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Building2,
  ShieldCheck,
  QrCode,
  Clock,
  Compass,
  User,
  CheckCircle2,
  Lock,
  Smartphone,
  MapPin,
  Sparkles,
  Camera,
  RefreshCw,
  Search,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  Layers,
  Crown,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePassVirtualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName?: string;
  employeeEmail?: string;
  companyName?: string;
  department?: string;
  tierName?: string;
  visitsLeft?: number;
  totalVisits?: number;
}

// 3D Isometric Hexagonal 'P' Logo Mark (Exact Vector from Mobile App)
function IsometricHexMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PolyFit 3D Isometric Hexagonal Logo"
    >
      <defs>
        <linearGradient id="pv-facet-top" x1="20" y1="12" x2="80" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34E58C" />
          <stop offset="100%" stopColor="#28D17C" />
        </linearGradient>
        <linearGradient id="pv-facet-left" x1="16" y1="28" x2="52" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#28D17C" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="pv-facet-right" x1="48" y1="28" x2="84" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="pv-facet-inner" x1="36" y1="36" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B1F33" />
          <stop offset="100%" stopColor="#142C44" />
        </linearGradient>
      </defs>
      <path d="M50 10L82 28.5L68 36.5L50 26L32 36.5L18 28.5L50 10Z" fill="url(#pv-facet-top)" />
      <path d="M82 28.5V56.5L68 64.5V36.5L82 28.5Z" fill="url(#pv-facet-right)" />
      <path d="M68 64.5L50 54V46L68 36.5V64.5Z" fill="url(#pv-facet-inner)" />
      <path d="M18 28.5V75.5L32 83.5V36.5L18 28.5Z" fill="url(#pv-facet-left)" />
      <path d="M18 75.5L50 94V86L32 75.5L18 75.5Z" fill="url(#pv-facet-left)" />
      <path d="M32 83.5L50 94V66L32 55.5V83.5Z" fill="url(#pv-facet-right)" />
      <path d="M32 55.5L50 66L68 55.5L50 45L32 55.5Z" fill="url(#pv-facet-top)" />
    </svg>
  );
}

const PARTNER_FACILITIES = [
  {
    id: "f1",
    name: "Olympic Aquatic Center",
    category: "Aquatic Pool",
    neighborhood: "Kiyovu, Kigali",
    distance: "450m away",
    status: "Open Now • Closes 21:00",
  },
  {
    id: "f2",
    name: "Kigali Heights Fitness Club",
    category: "Fitness & Strength",
    neighborhood: "Kimihurura, Kigali",
    distance: "1.2 km away",
    status: "Open Now • Closes 22:00",
  },
  {
    id: "f3",
    name: "Kigali Strength & Performance",
    category: "Cardio & Strength",
    neighborhood: "Downtown Kigali",
    distance: "2.1 km away",
    status: "Open Now • Closes 21:30",
  },
  {
    id: "f4",
    name: "Yoga & Reformer Studio",
    category: "Reformer Pilates",
    neighborhood: "Kacyiru, Kigali",
    distance: "3.4 km away",
    status: "Open Now • Closes 20:00",
  },
];

export function LivePassVirtualizationModal({
  isOpen,
  onClose,
  employeeName = "Diane Uwera",
  employeeEmail = "diane.uwera@company.rw",
  companyName = "Bank of Kigali",
  department = "Commercial Banking",
  tierName = "Starter Corporate Tier",
  visitsLeft = 8,
  totalVisits = 12,
}: LivePassVirtualizationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"pass" | "explore" | "profile">("pass");

  // Dynamic 15-second RFC 6238 TOTP Pass Simulation
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [totpCode, setTotpCode] = useState("782 914");
  const [liveTimestamp, setLiveTimestamp] = useState("09:41:00");

  // Modality B Plaque Scanner simulation states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    facilityName: string;
    neighborhood: string;
    time: string;
  } | null>(null);

  // Dynamic visits count
  const [currentVisitsLeft, setCurrentVisitsLeft] = useState(visitsLeft);

  // Filter explore state
  const [exploreCategory, setExploreCategory] = useState("all");
  const [exploreSearch, setExploreSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentVisitsLeft(visitsLeft);
  }, [visitsLeft]);

  // Sync native <dialog> with isOpen state and promote to browser Top Layer
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Generate dynamic 15-second RFC 6238 TOTP rotation
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const now = new Date();
      setLiveTimestamp(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          const p1 = Math.floor(100 + Math.random() * 900);
          const p2 = Math.floor(100 + Math.random() * 900);
          setTotpCode(`${p1} ${p2}`);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle native Escape key
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  // Handle click outside drawer chassis on native backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      onClose();
    }
  };

  // Simulate scanning a plaque at the front desk
  const handleSimulateScan = (facilityName: string, neighborhood: string) => {
    setIsScannerOpen(false);
    setCurrentVisitsLeft((prev) => Math.max(0, prev - 1));
    setSuccessReceipt({
      facilityName,
      neighborhood,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const progressPercent = Math.round((secondsRemaining / 15) * 100);

  const orgDomain = companyName.toLowerCase().includes("techcorp")
    ? "techcorp.rw"
    : companyName.toLowerCase().includes("bank") || companyName.toLowerCase().includes("kigali")
    ? "bk.rw"
    : "corporate.rw";

  const filteredVenues = PARTNER_FACILITIES.filter((v) => {
    if (exploreCategory === "fitness" && !v.category.toLowerCase().includes("fitness") && !v.category.toLowerCase().includes("strength")) return false;
    if (exploreCategory === "pool" && !v.category.toLowerCase().includes("pool")) return false;
    if (exploreCategory === "studio" && !v.category.toLowerCase().includes("pilates") && !v.category.toLowerCase().includes("yoga")) return false;
    if (exploreSearch.trim()) {
      const q = exploreSearch.toLowerCase();
      return v.name.toLowerCase().includes(q) || v.neighborhood.toLowerCase().includes(q);
    }
    return true;
  });

  if (!mounted || !isOpen) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      className="fixed inset-y-0 right-0 left-auto m-0 ml-auto h-[100dvh] max-h-none w-full max-w-md sm:max-w-lg p-0 bg-transparent border-none text-white overflow-hidden shadow-2xl backdrop:bg-slate-950/70 backdrop:backdrop-blur-xs z-[9999] outline-none select-none"
      aria-labelledby="pass-virtualization-title"
    >
      {/* Slide-over Drawer Panel */}
      <div className="h-full w-full bg-[#0B1F33] border-l border-[#21405A] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-[#21405A] bg-[#071521] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#28D17C]/15 border border-[#28D17C]/30 flex items-center justify-center text-[#28D17C]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span
                id="pass-virtualization-title"
                className="text-xs font-bold text-white tracking-wide uppercase font-mono block"
              >
                Employee Mobile App Preview
              </span>
              <span className="text-[10px] text-slate-400">
                Pixel-Perfect Expo 56 Mobile Experience
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] font-semibold border border-[#28D17C]/30">
              15s ROTATING TOTP
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close pass preview drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Body with Photorealistic Phone Chassis */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-start bg-slate-950/60 space-y-4">
          <div className="w-full max-w-[320px] text-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
            Interactive digital twin of what staff see when opening the PolyFit app at partner turnstiles and desks.
          </div>

          {/* Photorealistic iPhone 16 Frame Chassis */}
          <div className="w-[300px] sm:w-[320px] h-[640px] bg-[#071521] rounded-[48px] border-[7px] border-[#132D43] shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-white/15 select-none shrink-0 my-1">
            {/* Dynamic Island Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-40 flex items-center justify-between px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
              <div className="w-2 h-2 rounded-full bg-[#28D17C]/60 animate-pulse" />
            </div>

            {/* Phone Status Bar */}
            <div className="h-8 px-6 flex items-center justify-between text-[10px] font-semibold text-slate-400 z-30 pt-1 shrink-0">
              <span>09:41</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-[#28D17C]">5G</span>
                <div className="w-4 h-2 border border-slate-400 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-[#28D17C] rounded-xs" />
                </div>
              </div>
            </div>

            {/* Simulated Phone Screen Body */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden text-white relative">
              {/* TAB 1: HERO ACCESS PASS (PF-101) */}
              {activeTab === "pass" && (
                <div className="flex-1 px-3 py-1.5 flex flex-col justify-between overflow-y-auto space-y-2">
                  {/* Top Brand Header (Exact Mobile App Component) */}
                  <div className="flex items-center justify-between px-1 shrink-0">
                    <div className="flex items-center gap-2">
                      <IsometricHexMark size={24} />
                      <div className="leading-tight">
                        <div className="text-xs font-black tracking-tight text-white flex items-center gap-0.5">
                          <span>Poly</span>
                          <span className="text-[#28D17C]">Fit</span>
                        </div>
                        <div className="text-[7.5px] font-extrabold uppercase tracking-widest text-[#00D2B4]">
                          WELLNESS NETWORK
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#28D17C]/15 border border-[#28D17C]/30 text-[#28D17C]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C] animate-pulse" />
                      <span className="text-[8.5px] font-black uppercase tracking-wider">ACTIVE PASS</span>
                    </div>
                  </div>

                  {/* Apple Wallet Style Hero Pass Card */}
                  <div className="bg-[#0B1F33] rounded-2xl p-3 border border-white/10 shadow-xl space-y-2.5 relative overflow-hidden">
                    {/* Card Header: Employer Info */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-[#00D2B4] shrink-0" />
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">{companyName}</span>
                        <span className="text-[8.5px] font-semibold text-[#00D2B4] bg-[#00D2B4]/15 px-1.5 py-0.5 rounded">
                          {orgDomain}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#28D17C]/15 text-[#28D17C] text-[8.5px] font-bold">
                        <ShieldCheck className="w-3 h-3" />
                        <span>VERIFIED</span>
                      </div>
                    </div>

                    {/* Beneficiary Row */}
                    <div className="flex items-center justify-between text-left">
                      <div>
                        <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">BENEFICIARY</div>
                        <div className="text-xs font-extrabold text-white truncate max-w-[130px]">{employeeName}</div>
                        <div className="text-[9px] text-slate-400 truncate max-w-[130px]">{department}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-md bg-[#28D17C]/15 text-[#28D17C] border border-[#28D17C]/30 uppercase tracking-wide">
                          {tierName.replace(/Corporate/i, "").trim() || "Active Tier"}
                        </span>
                      </div>
                    </div>

                    {/* QR Frame Wrapper with Dynamic Watermark */}
                    <div className="bg-white p-2.5 rounded-xl shadow-inner relative flex flex-col items-center justify-center">
                      <div className="w-24 h-24 relative flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-[#0B1F33]" />
                        {/* Anti-screenshot moving ribbon bar */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
                          <div className="w-full h-2 bg-[#28D17C]/40 blur-xs absolute top-1/2 -translate-y-1/2 animate-bounce" />
                        </div>
                      </div>
                      <div className="text-[7.5px] font-mono text-slate-600 truncate max-w-[190px] mt-1">
                        {employeeName} • {companyName} • {liveTimestamp}
                      </div>
                    </div>

                    {/* Rotating TOTP Window & Front Desk Code */}
                    <div className="bg-[#071521]/80 rounded-xl p-2 border border-white/5 space-y-1.5 text-center">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1 text-[8.5px] text-[#28D17C] font-mono font-bold">
                          <Clock className="w-3 h-3 text-[#28D17C] animate-spin" />
                          <span>{secondsRemaining}s window</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[7.5px] font-bold uppercase text-slate-400">FRONT DESK CODE</div>
                        </div>
                      </div>

                      <div className="text-lg font-black font-mono tracking-widest text-[#28D17C]">
                        {totpCode}
                      </div>

                      {/* 15s Linear Progress Bar */}
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-1000",
                            secondsRemaining <= 3 ? "bg-rose-500" : "bg-[#28D17C]"
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-center gap-1 text-[7.5px] text-slate-400 pt-0.5">
                        <RefreshCw className="w-2.5 h-2.5 text-[#28D17C]" />
                        <span>Rotating RFC 6238 TOTP (Turnstile & Desk Ready)</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Modality B Action: Scan Partner Reception Plaque */}
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full p-2.5 rounded-xl bg-gradient-to-r from-[#0B1F33] to-[#132D43] border border-[#28D17C]/40 hover:border-[#28D17C] flex items-center gap-2.5 transition-all shadow-md cursor-pointer text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#28D17C] flex items-center justify-center text-[#0B1F33] shrink-0 group-hover:scale-105 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Scan Desk Plaque</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                      </div>
                      <div className="text-[8.5px] text-slate-300 truncate">
                        At boutique desk without turnstile scanner
                      </div>
                    </div>
                  </button>

                  {/* Quota & Allocation Summary Pill */}
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 grid grid-cols-3 divide-x divide-white/10 text-center">
                    <div>
                      <div className="text-xs font-black text-white font-mono">{totalVisits}</div>
                      <div className="text-[7.5px] text-slate-400 uppercase">Monthly Visits</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#28D17C] font-mono">{currentVisitsLeft}</div>
                      <div className="text-[7.5px] text-slate-400 uppercase">Remaining</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">0 RWF</div>
                      <div className="text-[7.5px] text-slate-400 uppercase">100% Funded</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXPLORE NETWORK VENUES (PF-100) */}
              {activeTab === "explore" && (
                <div className="flex-1 px-3 py-1.5 flex flex-col overflow-y-auto space-y-2 text-left">
                  {/* Explore Header */}
                  <div>
                    <div className="text-xs font-black text-white">Explore Network</div>
                    <div className="text-[9px] text-slate-400">52+ partner facilities across Kigali</div>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={exploreSearch}
                      onChange={(e) => setExploreSearch(e.target.value)}
                      placeholder="Search facilities, amenities..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0B1F33] border border-white/10 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-[#28D17C]"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[9px]">
                    {[
                      { id: "all", label: "All" },
                      { id: "fitness", label: "Fitness" },
                      { id: "pool", label: "Swimming" },
                      { id: "studio", label: "Yoga & Pilates" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setExploreCategory(cat.id)}
                        className={cn(
                          "px-2 py-0.5 rounded-md font-bold shrink-0 transition-colors cursor-pointer",
                          exploreCategory === cat.id
                            ? "bg-[#28D17C] text-[#0B1F33]"
                            : "bg-[#0B1F33] text-slate-300 border border-white/10"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Venues List */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto">
                    {filteredVenues.map((v) => (
                      <div
                        key={v.id}
                        className="p-2 rounded-xl bg-[#0B1F33] border border-white/10 flex items-center justify-between text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-[11px] font-bold text-white truncate">{v.name}</div>
                          <div className="text-[9px] text-[#00D2B4] font-semibold">{v.category}</div>
                          <div className="text-[8.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{v.neighborhood} • {v.distance}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSimulateScan(v.name, v.neighborhood)}
                          className="px-2 py-1 rounded-lg bg-[#28D17C]/15 text-[#28D17C] hover:bg-[#28D17C] hover:text-[#0B1F33] text-[9px] font-bold shrink-0 transition-all cursor-pointer"
                        >
                          Check In
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: BENEFIT STATUS & PROFILE (PF-102) */}
              {activeTab === "profile" && (
                <div className="flex-1 px-3 py-1.5 flex flex-col overflow-y-auto space-y-2.5 text-left">
                  {/* Beneficiary Header */}
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0B1F33] border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-[#28D17C] text-[#0B1F33] font-black text-sm flex items-center justify-center shrink-0">
                      {employeeName.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{employeeName}</div>
                      <div className="text-[9px] text-slate-400 truncate">{employeeEmail}</div>
                      <div className="text-[9px] font-semibold text-[#28D17C]">{companyName} • {department}</div>
                    </div>
                  </div>

                  {/* Active Benefit Card */}
                  <div className="p-3 rounded-xl bg-[#0B1F33] border border-white/10 space-y-2 text-[10px]">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                      <span className="font-bold text-white">Active Corporate Plan</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#28D17C]/15 text-[#28D17C] font-bold text-[8.5px]">
                        100% SPONSORED
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Benefit Tier:</span>
                      <span className="font-bold text-white">{tierName}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Monthly Quota:</span>
                      <span className="font-bold text-white font-mono">{totalVisits} Visits / Mo</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Visits Remaining:</span>
                      <span className="font-bold text-[#28D17C] font-mono">{currentVisitsLeft} Visits</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Employee Co-Pay:</span>
                      <span className="font-bold text-[#28D17C]">0 RWF (Zero Out-of-Pocket)</span>
                    </div>

                    {/* Quota Progress */}
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between text-[8px] text-slate-400">
                        <span>Used: {totalVisits - currentVisitsLeft}</span>
                        <span>Allowance: {totalVisits}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#28D17C]"
                          style={{ width: `${Math.round(((totalVisits - currentVisitsLeft) / totalVisits) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recent Verified Visits */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Recent Activity
                    </div>
                    {[
                      { fac: "Olympic Aquatic Center", date: "Yesterday, 17:35", method: "Desk Plaque Scan" },
                      { fac: "Kigali Heights Fitness Club", date: "Oct 10, 06:45", method: "Turnstile QR" },
                    ].map((v, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-[9px]"
                      >
                        <div>
                          <div className="font-bold text-white">{v.fac}</div>
                          <div className="text-slate-400">{v.date} • {v.method}</div>
                        </div>
                        <span className="text-[8px] font-bold text-[#28D17C] bg-[#28D17C]/15 px-1.5 py-0.5 rounded">
                          VERIFIED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODALITY B: IN-APP DESK PLAQUE SCANNER MODAL */}
              {isScannerOpen && (
                <div className="absolute inset-0 bg-[#071521]/95 z-50 p-4 flex flex-col justify-between animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#28D17C]" />
                      <span>Scan Desk Plaque</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(false)}
                      className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Simulated Camera Viewfinder */}
                  <div className="w-48 h-48 mx-auto my-auto rounded-2xl border-2 border-[#28D17C] relative flex items-center justify-center overflow-hidden shadow-2xl bg-slate-900/80">
                    <div className="w-40 h-40 border border-dashed border-white/40 rounded-xl flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-white/30 animate-pulse" />
                    </div>
                    {/* Viewfinder scanning laser line */}
                    <div className="absolute inset-x-0 h-0.5 bg-[#28D17C] shadow-[0_0_8px_#28D17C] animate-bounce" />
                  </div>

                  {/* Quick partner plaque simulator buttons */}
                  <div className="space-y-1.5 text-center">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">
                      Simulate Official Front Desk QR:
                    </div>
                    <div className="space-y-1">
                      {PARTNER_FACILITIES.slice(0, 3).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleSimulateScan(f.name, f.neighborhood)}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-[#0B1F33] hover:bg-[#28D17C] hover:text-[#0B1F33] border border-white/10 text-[9.5px] font-bold text-white transition-all text-left flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{f.name}</span>
                          <span className="text-[8px] opacity-75">{f.neighborhood.split(",")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CELEBRATORY CHECK-IN RECEIPT MODAL */}
              {successReceipt && (
                <div className="absolute inset-0 bg-[#071521]/95 z-50 p-4 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-[#28D17C]/20 border-2 border-[#28D17C] flex items-center justify-center text-[#28D17C] mb-3 shadow-[0_0_24px_rgba(40,209,124,0.3)] animate-pulse">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="text-base font-black text-white">Access Granted</div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    Welcome to <span className="text-[#28D17C] font-bold">{successReceipt.facilityName}</span>
                  </div>

                  {/* Visit Receipt Card */}
                  <div className="w-full my-3 p-3 rounded-xl bg-[#0B1F33] border border-white/10 text-left text-[9.5px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Beneficiary:</span>
                      <span className="font-bold text-white">{employeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Employer:</span>
                      <span className="font-bold text-white">{companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Verified At:</span>
                      <span className="font-mono text-[#28D17C]">{successReceipt.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Visits Remaining:</span>
                      <span className="font-bold font-mono text-[#28D17C]">{currentVisitsLeft} Visits</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSuccessReceipt(null)}
                    className="w-full py-2 rounded-xl bg-[#28D17C] text-[#0B1F33] font-bold text-xs hover:bg-[#22BC6E] transition-all cursor-pointer shadow-md"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Bottom 3-Tab Navigator (Exact Expo Router Layout) */}
              <div className="h-12 border-t border-[#21405A] bg-[#0B1F33] flex items-center justify-around px-2 text-[9px] text-slate-400 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("pass")}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer",
                    activeTab === "pass"
                      ? "text-[#28D17C] font-bold bg-[#28D17C]/15"
                      : "hover:text-white"
                  )}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>My Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("explore")}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer",
                    activeTab === "explore"
                      ? "text-[#28D17C] font-bold bg-[#28D17C]/15"
                      : "hover:text-white"
                  )}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer",
                    activeTab === "profile"
                      ? "text-[#28D17C] font-bold bg-[#28D17C]/15"
                      : "hover:text-white"
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[320px] p-3 rounded-xl bg-white/5 border border-[#21405A] text-[10px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#28D17C]" />
              <span>Offline Pass Vault & Instant TOTP</span>
            </div>
            <p className="leading-relaxed">
              When employee phones lose cellular reception inside basements or sports clubs, the offline TOTP seed validates locally without turnstile failure.
            </p>
          </div>
        </div>

        {/* Drawer Footer CTA */}
        <div className="p-4 border-t border-[#21405A] bg-[#071521] flex items-center justify-between shrink-0 gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5 text-[11px] truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C] shrink-0" />
            <span className="truncate">Synced with live corporate census</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold transition-all shadow-md cursor-pointer text-center text-xs whitespace-nowrap shrink-0"
          >
            Done Previewing
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
