"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Building2, Dumbbell, Waves, Sparkles, ShieldCheck, BadgeCheck, Activity, MapPin } from "lucide-react";
import { IsometricHexMark } from "@/components/ui/polyfit-logo";

const VERIFIED_ACCESS_EVENTS = [
  { tier: "Corporate Tier A", venue: "WAKA Fitness Kimihurura", category: "Gym & Strength", method: "15s Dynamic TOTP Pass", status: "Verified" },
  { tier: "Executive Pass", venue: "Cercle Sportif (CSK)", category: "Olympic Pool & Tennis", method: "Anti-Passback Validated", status: "Verified" },
  { tier: "Wellness Tier", venue: "Zenith Studio Kacyiru", category: "Reformer Pilates & Yoga", method: "Dynamic TOTP Pass", status: "Verified" },
  { tier: "Corporate Tier B", venue: "Cali Fitness & Pool", category: "Swim & Cardio", method: "Geofence Verified", status: "Verified" }
];

export default function SolutionSection() {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % VERIFIED_ACCESS_EVENTS.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const activeEvent = VERIFIED_ACCESS_EVENTS[currentEventIndex];

  return (
    <section className="py-16 sm:py-24 bg-white text-slate-900 border-t border-gray-200/60" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2 font-mono">
              The PolyFit Solution
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4 sm:mb-6 leading-tight">
              One benefit. <br className="hidden sm:inline" />
              Multiple places to move.
            </h2>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 sm:mb-8 font-normal">
              Instead of locking your company into rigid, single-gym corporate contracts, PolyFit connects employers and employees to a unified multi-facility wellness infrastructure.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  <strong className="text-slate-900 font-semibold">One corporate agreement:</strong> Your HR team coordinates a single wellness benefit with consolidated RRA EBM 18% VAT invoicing.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  <strong className="text-slate-900 font-semibold">Multi-category access:</strong> Employees check in at Kigali&apos;s leading gyms, Olympic swimming pools, and pilates studios with dynamic TOTP passes.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  <strong className="text-slate-900 font-semibold">Automated clearinghouse:</strong> Verified digital check-ins ensure providers receive transparent monthly payouts and HR retains real-time telemetry.
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual Architecture (Elevated Connected Benefit Flow) */}
          <div className="lg:col-span-7 w-full">
            <div className="relative rounded-[20px] bg-slate-900 border border-slate-700 p-5 sm:p-7 text-white shadow-2xl overflow-hidden">
              
              {/* Subtle background glow */}
              <div 
                className="absolute -top-24 -right-24 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              {/* Header Telemetry Pill */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 truncate flex items-center gap-1.5 font-mono">
                    <Activity className="w-3.5 h-3.5 text-accent" />
                    Connected Benefit Architecture
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold text-accent">
                  <span>15+ Locations • 2,500+ Active Capacity</span>
                </div>
              </div>

              {/* 3-Tier Aggregator Flow Canvas */}
              <div className="relative py-6 flex flex-col items-center">
                
                {/* 1. Employer Tier */}
                <div className="w-full max-w-md p-3.5 rounded-[12px] bg-slate-800 border border-slate-700 shadow-md flex items-center justify-between gap-3 group hover:border-accent/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[10px] bg-slate-950 border border-slate-700 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">1. Corporate Employer</span>
                        <span className="text-[9px] font-mono bg-accent/15 text-accent px-1.5 py-0.2 rounded font-semibold">HR & Finance</span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">Sets benefit budget, roster & receives consolidated 18% VAT invoices</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded whitespace-nowrap hidden sm:inline">
                    1 Agreement
                  </span>
                </div>

                {/* Animated Flow Stem: Employer -> PolyFit */}
                <div className="flex flex-col items-center my-1">
                  <svg className="w-4 h-6 text-accent" viewBox="0 0 16 24" fill="none">
                    <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  </svg>
                </div>

                {/* 2. PolyFit Telemetric Hub */}
                <div className="w-full max-w-lg p-4 rounded-[14px] bg-slate-950 border border-accent/50 shadow-xl shadow-accent/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative p-1.5 rounded-[12px] bg-slate-900 border border-accent/40 shadow-xs flex-shrink-0">
                      <IsometricHexMark size={36} />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-accent text-slate-950 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-accent uppercase tracking-wide">2. PolyFit Aggregator Core</span>
                        <span className="text-[9px] font-mono bg-secondary/15 text-secondary px-1.5 py-0.2 rounded font-semibold">Router</span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">Eligibility gatekeeper • 60s Dynamic TOTP passes • Anti-passback fraud shield</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-950 bg-accent px-2.5 py-1 rounded-full whitespace-nowrap hidden sm:inline">
                    Active Telemetry
                  </span>
                </div>

                {/* Branching Animated Stem: PolyFit -> Multi-Providers */}
                <div className="w-full max-w-md my-1 text-accent">
                  <svg className="w-full h-8" viewBox="0 0 400 32" fill="none" preserveAspectRatio="none">
                    <path d="M 200 0 L 200 12 C 200 20, 60 16, 60 32" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                    <path d="M 200 0 L 200 32" stroke="currentColor" strokeWidth="2" />
                    <path d="M 200 0 L 200 12 C 200 20, 340 16, 340 32" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  </svg>
                </div>

                {/* 3. Real Multi-Category Provider Network */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full">
                  
                  {/* Provider 1: Gym & Strength */}
                  <div className="p-3 rounded-[10px] bg-slate-800 border border-slate-700 hover:border-accent/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-[6px] bg-accent/15 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-accent uppercase tracking-wider">Gym & Strength</span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">WAKA Fitness</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-accent" /> Kimihurura
                    </p>
                  </div>

                  {/* Provider 2: Olympic Pool & Multi-sport */}
                  <div className="p-3 rounded-[10px] bg-slate-800 border border-slate-700 hover:border-secondary/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-[6px] bg-secondary/15 flex items-center justify-center flex-shrink-0">
                        <Waves className="w-3.5 h-3.5 text-secondary" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-secondary uppercase tracking-wider">Olympic Pool & Club</span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">Cercle Sportif (CSK)</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-secondary" /> Rugunga
                    </p>
                  </div>

                  {/* Provider 3: Reformer & Studio */}
                  <div className="p-3 rounded-[10px] bg-slate-800 border border-slate-700 hover:border-highlight/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-[6px] bg-highlight/15 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-highlight" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-highlight uppercase tracking-wider">Pilates & Yoga</span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">Zenith Studio</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-highlight" /> Kacyiru
                    </p>
                  </div>

                </div>

              </div>

              {/* Integrated Live Verified Visit Ticker */}
              <div className="pt-3 border-t border-slate-700">
                <div className="flex items-center justify-between gap-2 bg-slate-950 px-3.5 py-2.5 rounded-[10px] border border-slate-700">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1 rounded-full bg-emerald-950/60 text-emerald-400 flex-shrink-0">
                      <BadgeCheck className="w-3.5 h-3.5" />
                    </span>
                    <div className="text-[11px] text-slate-200 truncate font-sans">
                      <span className="text-white font-semibold">{activeEvent.tier}</span>
                      <span className="text-slate-400"> → </span>
                      <span className="text-accent font-semibold">{activeEvent.venue}</span>
                      <span className="text-slate-400 text-[10px] ml-1.5 hidden sm:inline">({activeEvent.method})</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full flex-shrink-0 font-bold">
                    {activeEvent.status}
                  </span>
                </div>
              </div>

              {/* Bottom Summary Bar */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-300 gap-2">
                <span className="text-center sm:text-left text-slate-300 font-medium">
                  Employees have choice • Facilities receive customers • Employers retain visibility
                </span>
                <span className="font-mono text-[10px] text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                  ✓ 100% Tax Deductible
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
