"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Activity,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Info,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdoptionFunnelData {
  totalEligible: number;
  registeredEmployees: number;
  activeBeneficiaries: number;
  totalVisits: number;
  newEmployees30d?: number;
  newBeneficiaries30d?: number;
  avgVisitsPerActive?: number;
}

interface AdoptionFunnelRowProps {
  data: AdoptionFunnelData;
  className?: string;
  onUpdateListClick?: () => void;
}

export function AdoptionFunnelRow({
  data,
  className,
  onUpdateListClick,
}: AdoptionFunnelRowProps) {
  const {
    totalEligible = 1200,
    registeredEmployees = 789,
    activeBeneficiaries = 412,
    totalVisits = 1480,
    newEmployees30d = 54,
    newBeneficiaries30d = 28,
    avgVisitsPerActive = 3.6,
  } = data;

  const employeeAdoptionRate = totalEligible > 0
    ? Math.round((registeredEmployees / totalEligible) * 100)
    : 0;

  const activeConversionRate = registeredEmployees > 0
    ? Math.round((activeBeneficiaries / registeredEmployees) * 100)
    : 0;

  const overallParticipationRate = totalEligible > 0
    ? Math.round((activeBeneficiaries / totalEligible) * 100)
    : 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Funnel Stage Header with Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#0B1F33]">
            Workforce Benefit Adoption Funnel
          </h2>
          <div className="group relative cursor-pointer" title="4-stage conversion tracking from roster to active visits">
            <Info className="w-3.5 h-3.5 text-[#8491A3] hover:text-[#0B1F33] transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#526173]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#28D17C]" />
            Overall Participation:{" "}
            <strong className="text-[#0B1F33] font-semibold">{overallParticipationRate}%</strong>
          </span>
          <span className="text-[#E2E8F0]">|</span>
          <span className="text-[11px] text-[#8491A3]">Updated live</span>
        </div>
      </div>

      {/* Visual Multi-Stage Progress Funnel Bar */}
      <div className="w-full h-2 rounded-full bg-[#F1F4F8] overflow-hidden flex shadow-inner">
        <div
          className="h-full bg-[#0B1F33] transition-all duration-700 ease-out"
          style={{ width: "100%" }}
          title="100% Eligible Employees"
        />
        <div
          className="h-full bg-[#00D2B4] transition-all duration-700 ease-out"
          style={{ width: `${employeeAdoptionRate}%` }}
          title={`${employeeAdoptionRate}% Registered Employees`}
        />
        <div
          className="h-full bg-[#28D17C] transition-all duration-700 ease-out"
          style={{ width: `${overallParticipationRate}%` }}
          title={`${overallParticipationRate}% Active Monthly Beneficiaries`}
        />
      </div>

      {/* 4-Card Funnel Metric Grid (Direct Wellhub Inspiration) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stage 1: Eligible Employees */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F1F4F8] flex items-center justify-center text-[#0B1F33] group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#526173]">Employees</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F4F8] text-[#526173]">
              Roster
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-bold tracking-tight text-[#0B1F33]">
              {totalEligible.toLocaleString()}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#F1F4F8] flex items-center justify-between">
            <span className="text-[11px] text-[#8491A3]">Census headcount</span>
            <Link
              href="/corporate/employees"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B1F33] hover:text-[#28D17C] transition-colors"
            >
              <span>Manage Roster</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Stage 2: Registered Employees */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E0F9F5] flex items-center justify-center text-[#00D2B4] group-hover:scale-105 transition-transform">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#526173]">Employees</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#00D2B4] bg-[#E0F9F5] px-2 py-0.5 rounded-full">
              <span>{employeeAdoptionRate}%</span>
              <span className="text-[10px] text-[#0B1F33]">adopted</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-bold tracking-tight text-[#0B1F33]">
              {registeredEmployees.toLocaleString()}
            </div>
            {newEmployees30d > 0 && (
              <div className="flex items-center gap-0.5 text-xs font-semibold text-[#28D17C]">
                <TrendingUp className="w-3 h-3" />
                <span>+{newEmployees30d}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-[#F1F4F8] flex items-center justify-between text-[11px] text-[#8491A3]">
            <span>App downloaded & verified</span>
            <span className="text-[#526173] font-medium">Last 30 days</span>
          </div>
        </div>

        {/* Stage 3: Active Beneficiaries */}
        <div className="p-4 rounded-2xl bg-white border border-[#28D17C]/30 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ring-1 ring-[#28D17C]/20">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#28D17C]/5 rounded-bl-full pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E9FAF2] flex items-center justify-center text-[#28D17C] group-hover:scale-105 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#0B1F33]">Active Beneficiaries</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#28D17C] bg-[#E9FAF2] px-2 py-0.5 rounded-full border border-[#28D17C]/20">
              <span>{activeConversionRate}%</span>
              <span className="text-[9px] uppercase font-semibold">of employees</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-bold tracking-tight text-[#0B1F33]">
              {activeBeneficiaries.toLocaleString()}
            </div>
            {newBeneficiaries30d > 0 && (
              <div className="flex items-center gap-0.5 text-xs font-semibold text-[#28D17C]">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+{newBeneficiaries30d}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-[#F1F4F8] flex items-center justify-between text-[11px] text-[#8491A3]">
            <span>Used benefit this cycle</span>
            <span className="text-[#28D17C] font-semibold">{overallParticipationRate}% total</span>
          </div>
        </div>

        {/* Stage 4: Verified Visits */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F7F9FC] flex items-center justify-center text-[#3B82F6] group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#526173]">Verified Visits</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E9FAF2] text-[#28D17C] border border-[#28D17C]/30 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              100% TOTP
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-bold tracking-tight text-[#0B1F33]">
              {totalVisits.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-[#526173]">
              ~{avgVisitsPerActive} <span className="text-[10px] text-[#8491A3]">visits/user</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#F1F4F8] flex items-center justify-between text-[11px] text-[#8491A3]">
            <span>Across all network venues</span>
            <Link
              href="/corporate/billing"
              className="text-[#3B82F6] hover:underline font-medium"
            >
              Audit trail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
