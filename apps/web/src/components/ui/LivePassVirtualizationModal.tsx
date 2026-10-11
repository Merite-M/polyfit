"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  ShieldCheck,
  QrCode,
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
  User,
  CheckCircle2,
  Lock,
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
  employeeName = "Jean Mugisha",
  employeeEmail = "jean.mugisha@bk.rw",
  companyName = "Bank of Kigali",
  department = "Commercial Banking",
  visitsLeft = 4,
  totalVisits = 12,
}: LivePassVirtualizationModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(42);
  const [totpCode, setTotpCode] = useState("031 007");
  const [activeTab, setActiveTab] = useState<"pass" | "explore" | "profile">("pass");

  // Generate dynamic pseudo-TOTP rotation every 60s
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Generate new 6-digit code
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-50 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pass-virtualization-title"
    >
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span
              id="pass-virtualization-title"
              className="text-xs font-bold text-slate-200 tracking-wide uppercase"
            >
              Mobile Pass Virtualization
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close pass preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Smartphone Bezel & Screen Wrapper */}
        <div className="p-4 sm:p-6 bg-slate-950/80 flex justify-center">
          <div className="w-full max-w-[320px] rounded-[38px] p-3 bg-slate-800 shadow-2xl border-4 border-slate-700/80 relative">
            {/* Dynamic Island / Speaker Notch */}
            <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
            </div>

            {/* Simulated Phone Screen */}
            <div className="w-full rounded-[28px] bg-[#071521] text-white overflow-hidden border border-white/5 flex flex-col h-[520px]">
              {/* Screen Top Status Bar */}
              <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>9:41</span>
                <span className="flex items-center gap-1 text-emerald-400 font-sans font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>PolyFit Secure</span>
                </span>
                <span>5G 100%</span>
              </div>

              {/* Main Tab Content */}
              {activeTab === "pass" && (
                <div className="flex-1 px-4 py-2 flex flex-col justify-between overflow-y-auto">
                  {/* Employer Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white truncate max-w-[140px]">
                          {companyName}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          Corporate Wellness Pass
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>

                  {/* Beneficiary Info */}
                  <div className="my-2 p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Beneficiary
                      </div>
                      <div className="text-xs font-bold text-white">
                        {employeeName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Remaining
                      </div>
                      <div className="text-xs font-extrabold text-emerald-400">
                        {visitsLeft} / {totalVisits}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Visits / Month
                      </div>
                    </div>
                  </div>

                  {/* QR / Turnstile Code Card */}
                  <div className="my-auto p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0B1F33] border border-emerald-500/30 text-center relative overflow-hidden shadow-lg">
                    {/* Simulated High-Security QR Pattern */}
                    <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-inner relative group">
                      <QrCode className="w-28 h-28 text-slate-950" />
                      <div className="absolute inset-0 bg-emerald-500/10 rounded-xl pointer-events-none" />
                    </div>

                    {/* Rotating TOTP Digital Reception Code */}
                    <div className="mt-3">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Turnstile / Reception Code
                      </div>
                      <div className="text-2xl font-extrabold font-mono tracking-widest text-emerald-400 mt-0.5">
                        {totpCode}
                      </div>
                    </div>

                    {/* Countdown Progress */}
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3 text-emerald-400 animate-spin" />
                      <span>Code refreshes in</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {secondsRemaining}s
                      </span>
                    </div>
                  </div>

                  {/* Anti-Passback Status Footer */}
                  <div className="pt-2 text-center text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      Hardware Locked • Turnstile Automated
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "explore" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
                  <div className="text-xs font-bold text-white mb-2">
                    Nearby Kigali Facilities
                  </div>
                  {[
                    {
                      name: "WAKA Fitness Kimihurura",
                      cat: "Gym & Functional",
                      dist: "1.2 km",
                    },
                    {
                      name: "Cercle Sportif de Kigali (CSK)",
                      cat: "Olympic Pool & Tennis",
                      dist: "2.4 km",
                    },
                    {
                      name: "Heaven Wellness Spa",
                      cat: "Thermal Recovery",
                      dist: "3.1 km",
                    },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">
                          {f.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {f.cat}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold">
                        {f.dist}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "profile" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  <div className="text-xs font-bold text-white mb-1">
                    Corporate Benefit Summary
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Employer:</span>
                      <span className="font-bold text-white">{companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sponsorship:</span>
                      <span className="font-bold text-emerald-400">100% Employer Funded</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Employee Co-Pay:</span>
                      <span className="font-bold text-white">0 RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reset Date:</span>
                      <span className="font-bold text-white">1st of Next Month</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 leading-relaxed">
                    ✓ Verified corporate benefit sponsored by your company. No payroll deductions or facility desk payments required.
                  </div>
                </div>
              )}

              {/* Bottom 3-Tab Navigator */}
              <div className="h-12 border-t border-white/10 bg-slate-900/90 flex items-center justify-around px-2 text-[10px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setActiveTab("pass")}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors cursor-pointer",
                    activeTab === "pass" ? "text-emerald-400 font-bold" : "hover:text-white"
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
                    activeTab === "explore" ? "text-emerald-400 font-bold" : "hover:text-white"
                  )}
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors cursor-pointer",
                    activeTab === "profile" ? "text-emerald-400 font-bold" : "hover:text-white"
                  )}
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom CTA */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Demonstrates what enrolled employees see on their phone</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="http://localhost:8085"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold transition-colors text-center"
            >
              Open Full Web App
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer text-center"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
