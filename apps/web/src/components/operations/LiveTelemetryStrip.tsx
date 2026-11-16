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
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Left: Telemetry Heartbeat */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#E9FAF2] border border-[#B7F1D2] text-[#008A4B]">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#28D17C] opacity-75"></span>
          <Radio className="w-5 h-5 relative" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-wide text-[#0B1F33]">
              NETWORK CHECK-IN STREAM
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] font-semibold border border-[#B7F1D2]">
              KIGALI OPERATIONAL HUB
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Live dynamic QR pass verification and partner facility access nominal.
          </p>
        </div>
      </div>

      {/* Center: Live Stats Counters */}
      <div className="flex items-center gap-4 sm:gap-6 text-xs divide-x divide-slate-100 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
        <div className="pr-2">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Today's Visits</div>
          <div className="font-mono text-base font-bold text-[#0B1F33] flex items-center gap-1.5 mt-0.5">
            <span>{todayVisits}</span>
            <span className="text-[10px] font-sans font-normal text-[#008A4B]">({todayVerified} verified)</span>
          </div>
        </div>

        <div className="pl-4 sm:pl-6">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Front-Desk Scanners</div>
          <div className="font-mono text-sm font-semibold text-[#008A4B] flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active &amp; Online</span>
          </div>
        </div>

        <div className="pl-4 sm:pl-6">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Velocity Flags</div>
          <div className={`font-mono text-sm font-bold flex items-center gap-1 mt-0.5 ${
            velocityAlerts > 0 ? "text-amber-600" : "text-slate-600"
          }`}>
            {velocityAlerts > 0 ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1F33] hover:bg-[#16385C] text-white font-bold text-xs transition-colors shadow-xs"
          >
            <span>Live Stream</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
