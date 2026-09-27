"use client";

import React, { useState, useEffect } from "react";
import { Building2, Dumbbell, Waves, Footprints, ShieldCheck, BadgeCheck, Activity, MapPin } from "lucide-react";
import { IsometricHexMark } from "@/components/ui/polyfit-logo";

const VERIFIED_ACCESS_EVENTS = [
  { tier: "Corporate Tier A", venue: "WAKA Fitness Kimihurura", category: "Gym & Strength", method: "15s Dynamic TOTP Pass", status: "Verified" },
  { tier: "Executive Pass", venue: "Cercle Sportif (CSK)", category: "Olympic Pool & Tennis", method: "Anti-Passback Validated", status: "Verified" },
  { tier: "Corporate Tier B", venue: "Cali Fitness & Pool", category: "Swim & Cardio", method: "Geofence & TOTP Pass", status: "Verified" },
  { tier: "Wellness Tier", venue: "Zenith Studio Kacyiru", category: "Reformer Pilates & Yoga", method: "15s Dynamic TOTP Pass", status: "Verified" }
];

export default function NetworkVisualization() {
  const [currentCheckInIndex, setCurrentCheckInIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCheckInIndex((prev) => (prev + 1) % VERIFIED_ACCESS_EVENTS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const activeCheckIn = VERIFIED_ACCESS_EVENTS[currentCheckInIndex];

  return (
    <div className="relative w-full max-w-lg mx-auto select-none px-1 sm:px-0">
      {/* Outer ambient glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#28D17C]/20 via-[#00D2B4]/20 to-[#B8F36B]/15 rounded-[18px] blur-xl opacity-75 pointer-events-none" />

      {/* Main Glass/Dark Executive Telemetry Card */}
      <div className="relative rounded-[16px] bg-[#0D2235]/95 border border-[#21405A] p-5 sm:p-7 backdrop-blur-md shadow-2xl overflow-hidden">
        
        {/* Top Telemetry Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#21405A] gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28D17C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#28D17C]"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 truncate flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#28D17C]" />
              Verification Engine
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#28D17C]/10 border border-[#28D17C]/30 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold text-[#28D17C]">
            <span>15+ Locations • 2,500+ Capacity</span>
          </div>
        </div>

        {/* Diagram Area with Animated Flows */}
        <div className="relative py-7 sm:py-9">
          {/* Animated Vector Connection Mesh */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 440 220"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Gradient definition for paths */}
            <defs>
              <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#28D17C" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#28D17C" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00D2B4" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Line from Employer to PolyFit Hub */}
            <path
              d="M 90 110 L 210 110"
              stroke="url(#flow-gradient)"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />

            {/* Line from PolyFit Hub to Gym (Top Right) */}
            <path
              d="M 230 95 C 275 60, 295 38, 345 38"
              stroke="url(#flow-gradient)"
              strokeWidth="2"
            />

            {/* Line from PolyFit Hub to Studio / Tennis (Center Right) */}
            <path
              d="M 235 110 L 345 110"
              stroke="url(#flow-gradient)"
              strokeWidth="2"
            />

            {/* Line from PolyFit Hub to Pool & Spa (Bottom Right) */}
            <path
              d="M 230 125 C 275 160, 295 182, 345 182"
              stroke="url(#flow-gradient)"
              strokeWidth="2"
            />

            {/* Traveling Data Particles representing Benefit & Verification Flow */}
            <circle r="3.5" fill="#28D17C">
              <animateMotion dur="2.1s" repeatCount="indefinite" path="M 90 110 L 210 110" />
            </circle>
            <circle r="3" fill="#B8F36B">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 230 95 C 275 60, 295 38, 345 38" />
            </circle>
            <circle r="3" fill="#00D2B4">
              <animateMotion dur="2.0s" repeatCount="indefinite" path="M 235 110 L 345 110" />
            </circle>
            <circle r="3" fill="#28D17C">
              <animateMotion dur="2.8s" repeatCount="indefinite" path="M 230 125 C 275 160, 295 182, 345 182" />
            </circle>
          </svg>

          {/* Interactive Node Layout */}
          <div className="relative flex items-center justify-between gap-2 sm:gap-4">
            
            {/* 1. Left Node: Corporate Employer */}
            <div className="flex flex-col items-center text-center w-24 sm:w-28 flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[12px] bg-[#132D43] border border-[#21405A] flex items-center justify-center shadow-lg mb-2 relative group-hover:border-[#28D17C]/50 transition-colors">
                <Building2 className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#28D17C] rounded-full border-2 border-[#0D2235]" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">Enterprise</span>
              <span className="text-[10px] text-slate-400 font-mono">1 Policy • 100% Tax</span>
            </div>

            {/* 2. Central Router Node: PolyFit 3D Isometric Mark */}
            <div className="flex flex-col items-center text-center flex-shrink-0">
              <div className="relative p-2.5 rounded-[16px] bg-[#071521] border border-[#28D17C]/40 shadow-xl shadow-[#28D17C]/15">
                <IsometricHexMark size={44} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#28D17C] text-[#0B1F33] rounded-full flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-2.5 h-2.5 stroke-[2.5]" />
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#28D17C] mt-2 tracking-tight">PolyFit Router</span>
              <span className="text-[9px] text-slate-300 font-mono uppercase tracking-wider">Dynamic TOTP</span>
            </div>

            {/* 3. Right Column: Partner Providers */}
            <div className="flex flex-col gap-2.5 w-32 sm:w-40 flex-shrink-0">
              {/* Gym */}
              <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-[10px] bg-[#132D43]/90 border border-[#21405A] hover:border-[#28D17C]/50 transition-all">
                <div className="w-7 h-7 rounded-[8px] bg-[#28D17C]/15 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-3.5 h-3.5 text-[#28D17C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">WAKA Fitness</p>
                  <p className="text-[9px] text-slate-400 truncate flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-[#28D17C]" /> Kimihurura
                  </p>
                </div>
              </div>

              {/* Tennis & Multi-Sport */}
              <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-[10px] bg-[#132D43]/90 border border-[#21405A] hover:border-[#00D2B4]/50 transition-all">
                <div className="w-7 h-7 rounded-[8px] bg-[#00D2B4]/15 flex items-center justify-center flex-shrink-0">
                  <Footprints className="w-3.5 h-3.5 text-[#00D2B4]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">Cercle Sportif (CSK)</p>
                  <p className="text-[9px] text-slate-400 truncate flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-[#00D2B4]" /> Rugunga
                  </p>
                </div>
              </div>

              {/* Pool & Recovery */}
              <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-[10px] bg-[#132D43]/90 border border-[#21405A] hover:border-[#B8F36B]/50 transition-all">
                <div className="w-7 h-7 rounded-[8px] bg-[#B8F36B]/15 flex items-center justify-center flex-shrink-0">
                  <Waves className="w-3.5 h-3.5 text-[#B8F36B]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">Cali Fitness & Pool</p>
                  <p className="text-[9px] text-slate-400 truncate flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-[#B8F36B]" /> Musanze
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Live Verified Visit Ticker */}
        <div className="pt-3 border-t border-[#21405A]">
          <div className="flex items-center justify-between gap-2 bg-[#071521]/70 px-3 py-2 rounded-[10px] border border-[#21405A]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1 rounded-full bg-[#E9FAF2] text-[#008A4B] flex-shrink-0">
                <BadgeCheck className="w-3.5 h-3.5" />
              </span>
              <div className="text-[11px] text-slate-200 truncate font-sans">
                <span className="text-white font-semibold">{activeCheckIn.tier}</span>
                <span className="text-slate-400"> → </span>
                <span className="text-[#28D17C] font-semibold">{activeCheckIn.venue}</span>
                <span className="text-slate-400 text-[10px] ml-1.5 hidden sm:inline">({activeCheckIn.method})</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#008A4B] bg-[#E9FAF2] px-2 py-0.5 rounded-full flex-shrink-0 font-bold">
              {activeCheckIn.status}
            </span>
          </div>
        </div>

        {/* Bottom Micro Badges */}
        <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-slate-400 px-1">
          <span>✓ RRA EBM 18% VAT Invoicing</span>
          <span>✓ Anti-Passback Hardware Protected</span>
        </div>

      </div>
    </div>
  );
}
