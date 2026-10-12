"use client";

import React, { useState, useEffect } from "react";
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
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePassVirtualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName?: string;
  employeeEmail?: string;
  companyName?: string;
  department?: string;
  visitsLeft?: number;
  totalVisits?: number;
}

export function LivePassVirtualizationModal({
  isOpen,
  onClose,
  employeeName = "Diane Uwera",
  employeeEmail = "diane.uwera@company.rw",
  companyName = "Enterprise Partner",
  department = "Engineering",
  visitsLeft = 8,
  totalVisits = 12,
}: LivePassVirtualizationModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(45);
  const [totpCode, setTotpCode] = useState("042 819");
  const [activeTab, setActiveTab] = useState<"pass" | "explore" | "profile">("pass");

  // Generate dynamic pseudo-TOTP rotation every 60s
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          const p1 = Math.floor(100 + Math.random() * 900);
          const p2 = Math.floor(100 + Math.random() * 900);
          setTotpCode(`${p1} ${p2}`);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle Escape key to close slide-over drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="pass-virtualization-title">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in-50 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-50 w-full max-w-md sm:max-w-lg bg-[#0B1F33] border-l border-[#21405A] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 overflow-hidden">
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
                Mobile Pass Preview
              </span>
              <span className="text-[10px] text-slate-400">
                Staff iOS & Android Experience
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] font-semibold border border-[#28D17C]/30">
              LIVE SIMULATION
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

        {/* Scrollable Drawer Body with Chassis */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-start bg-slate-950/50 space-y-4">
          <div className="w-full max-w-[320px] text-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
            Interactive preview of what your employees see when accessing partner turnstiles and desks.
          </div>

          {/* Photorealistic iPhone 16 Frame Chassis */}
          <div className="w-[280px] sm:w-[304px] h-[584px] bg-[#071521] rounded-[44px] border-[6px] border-[#132D43] shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-white/10 select-none shrink-0 my-1">
            {/* Dynamic Island Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-40 flex items-center justify-between px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
              <div className="w-2 h-2 rounded-full bg-[#28D17C]/40 animate-pulse" />
            </div>

            {/* Phone Status Bar */}
            <div className="h-8 px-6 flex items-center justify-between text-[10px] font-semibold text-slate-400 z-30 pt-1">
              <span>09:41</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-[#28D17C]">5G</span>
                <div className="w-4 h-2 border border-slate-400 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-[#28D17C] rounded-xs" />
                </div>
              </div>
            </div>

            {/* Simulated Phone Screen Body */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden text-white">
              {/* TAB 1: PASS VIEW */}
              {activeTab === "pass" && (
                <div className="flex-1 px-3.5 py-2 flex flex-col justify-between overflow-y-auto">
                  {/* Employer Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#21405A]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#28D17C]/15 border border-[#28D17C]/30 flex items-center justify-center text-[#28D17C]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white truncate max-w-[140px]">
                          {companyName}
                        </div>
                        <div className="text-[9px] text-[#28D17C] font-semibold">
                          Corporate Wellness Pass
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#28D17C]/15 text-[#28D17C] border border-[#28D17C]/30 font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>

                  {/* Beneficiary Card */}
                  <div className="my-1.5 p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-left">
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                        Beneficiary
                      </div>
                      <div className="text-xs font-bold text-white truncate max-w-[120px]">
                        {employeeName}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                        Quota
                      </div>
                      <div className="text-xs font-extrabold text-[#28D17C] font-mono">
                        {visitsLeft} / {totalVisits}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Visits Left
                      </div>
                    </div>
                  </div>

                  {/* Dynamic TOTP Pass Card */}
                  <div className="my-auto p-3 rounded-2xl bg-gradient-to-b from-[#0B1F33] to-[#071521] border border-[#28D17C]/30 text-center relative overflow-hidden shadow-lg">
                    {/* Simulated High-Security QR Pattern */}
                    <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-inner relative group">
                      <QrCode className="w-24 h-24 text-slate-950" />
                      <div className="absolute inset-0 bg-[#28D17C]/10 rounded-xl pointer-events-none" />
                    </div>

                    {/* Rotating TOTP Reception Code */}
                    <div className="mt-2.5">
                      <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        Turnstile / Reception Code
                      </div>
                      <div className="text-xl font-black font-mono tracking-widest text-[#28D17C] mt-0.5">
                        {totpCode}
                      </div>
                    </div>

                    {/* Countdown Progress */}
                    <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[9px] text-slate-400">
                      <Clock className="w-3 h-3 text-[#28D17C] animate-spin" />
                      <span>Refreshes in</span>
                      <span className="font-bold text-[#28D17C] font-mono">
                        {secondsRemaining}s
                      </span>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="pt-1 text-center text-[9px] text-slate-400">
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <Lock className="w-3 h-3 text-[#28D17C]" />
                      Device Locked &bull; Anti-Passback Active
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: EXPLORE NETWORK FACILITIES */}
              {activeTab === "explore" && (
                <div className="flex-1 p-3 overflow-y-auto space-y-2 text-left">
                  <div className="text-[11px] font-bold text-white mb-1.5 flex items-center justify-between">
                    <span>Participating Network Venues</span>
                    <span className="text-[9px] font-mono text-[#28D17C]">52 Venues</span>
                  </div>
                  {[
                    {
                      name: "Premier Multi-Club Hub",
                      cat: "Gym & Strength Training",
                      dist: "Kimihurura (1.2 km)",
                    },
                    {
                      name: "Olympic Aquatic & Tennis Club",
                      cat: "Olympic Pool & Racquets",
                      dist: "Rugunga (2.4 km)",
                    },
                    {
                      name: "Boutique Reformer Studio",
                      cat: "Reformer Pilates & Yoga",
                      dist: "Kacyiru (3.1 km)",
                    },
                    {
                      name: "High-Altitude Fitness Hub",
                      cat: "Cardio & Strength",
                      dist: "Remera (4.0 km)",
                    },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-[11px] font-bold text-white truncate">
                          {f.name}
                        </div>
                        <div className="text-[9px] text-[#28D17C] truncate">
                          {f.cat}
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          <span>{f.dist}</span>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#28D17C]/15 text-[#28D17C] font-semibold whitespace-nowrap">
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: BENEFIT PROFILE */}
              {activeTab === "profile" && (
                <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-left">
                  <div className="text-[11px] font-bold text-white mb-1">
                    Corporate Wellness Summary
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Employer:</span>
                      <span className="font-bold text-white">{companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Benefit Tier:</span>
                      <span className="font-bold text-[#28D17C]">Standard Corporate Tier</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sponsorship:</span>
                      <span className="font-bold text-[#28D17C]">100% Employer Funded</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Employee Co-Pay:</span>
                      <span className="font-bold text-white">0 RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Quota:</span>
                      <span className="font-bold text-white font-mono">{totalVisits} Visits / Mo</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#28D17C]/10 border border-[#28D17C]/20 text-[9px] text-[#28D17C] leading-relaxed">
                    ✓ Verified corporate wellness pass paid by your employer. No gym desk signups or out-of-pocket charges required.
                  </div>
                </div>
              )}

              {/* Bottom 3-Tab Navigator */}
              <div className="h-12 border-t border-[#21405A] bg-[#0B1F33] flex items-center justify-around px-2 text-[10px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setActiveTab("pass")}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors cursor-pointer",
                    activeTab === "pass" ? "text-[#28D17C] font-bold" : "hover:text-white"
                  )}
                >
                  <QrCode className="w-4 h-4" />
                  <span>My Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("explore")}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors cursor-pointer",
                    activeTab === "explore" ? "text-[#28D17C] font-bold" : "hover:text-white"
                  )}
                >
                  <Compass className="w-4 h-4" />
                  <span>Venues</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors cursor-pointer",
                    activeTab === "profile" ? "text-[#28D17C] font-bold" : "hover:text-white"
                  )}
                >
                  <User className="w-4 h-4" />
                  <span>Benefit</span>
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
    </div>
  );
}
