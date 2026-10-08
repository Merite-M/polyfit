"use client";

import React from "react";
import { Radio, ShieldAlert, ArrowUpRight, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface LiveTelemetryStripProps {
  todayVisits: number;
  todayVerified: number;
  activeDisputes: number;
  velocityAlerts: number;
}

export function LiveTelemetryStrip({
  todayVisits,
  todayVerified,
  activeDisputes,
  velocityAlerts,
}: LiveTelemetryStripProps) {
  return (
    <div className="bg-[#0B1F33] text-white rounded-2xl p-4 border border-[#21405A] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Left: Telemetry Heartbeat */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#142C44] border border-[#28D17C]/30 text-[#28D17C]">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#28D17C] opacity-75"></span>
          <Radio className="w-5 h-5 relative" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-wide text-white">
              LIVE NETWORK PULSE
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] font-semibold border border-[#28D17C]/30">
              KIGALI AGGREGATOR RUNTIME
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Real-time biometric IoT turnstiles & dynamic TOTP QR stream nominal.
          </p>
        </div>
      </div>

      {/* Center: Live Stats Counters */}
      <div className="flex items-center gap-4 sm:gap-6 text-xs divide-x divide-[#21405A] pt-2 md:pt-0 border-t md:border-t-0 border-[#21405A] w-full md:w-auto">
        <div className="pr-2">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Today's Visits</div>
          <div className="font-mono text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
            <span>{todayVisits}</span>
            <span className="text-[10px] font-sans font-normal text-[#28D17C]">({todayVerified} verified)</span>
          </div>
        </div>

        <div className="pl-4 sm:pl-6">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Turnstiles IoT</div>
          <div className="font-mono text-sm font-semibold text-[#00D2B4] flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>108 Online</span>
          </div>
        </div>

        <div className="pl-4 sm:pl-6">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Velocity Flags</div>
          <div className={`font-mono text-sm font-bold flex items-center gap-1 mt-0.5 ${
            velocityAlerts > 0 ? "text-amber-400" : "text-slate-300"
          }`}>
            {velocityAlerts > 0 ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>{velocityAlerts} Active</span>
              </>
            ) : (
              <span>0 Anomalies</span>
            )}
          </div>
        </div>

        <div className="pl-4 sm:pl-6">
          <Link
            href="/operations/visits"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs transition-colors shadow-xs"
          >
            <span>Live Stream</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
