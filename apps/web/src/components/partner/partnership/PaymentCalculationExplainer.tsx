'use client';

import React from 'react';
import {
  Calculator,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Percent,
  Minus,
  Equal
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { formatRwf } from '@/lib/invoice-pdf';

export function PaymentCalculationExplainer() {
  const { commercialConditions } = usePartner();
  const rules = commercialConditions?.payment_calculation_rules;

  const grossRate = rules?.gross_rate_per_checkin_rwf ?? 5000;
  const platformPct = rules?.platform_fee_percent ?? 10;
  const platformFee = Math.round((grossRate * platformPct) / 100);
  const netRate = rules?.net_payout_per_checkin_rwf ?? (grossRate - platformFee);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
      <div className="flex items-center gap-3 pb-5 border-b border-[#F1F4F8]">
        <div className="w-10 h-10 rounded-xl bg-[#28D17C]/15 text-[#008A4B] flex items-center justify-center shrink-0">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0B1F33]">
            Payment Calculation & Settlement Formula
          </h3>
          <p className="text-xs text-[#526173]">
            Transparent breakdown of how check-ins translate into net monthly disbursements.
          </p>
        </div>
      </div>

      {/* Visual Formula Cards */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Step 1: Gross Reimbursement */}
        <div className="w-full flex-1 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl p-4 text-center">
          <span className="text-[11px] font-bold text-[#8491A3] uppercase tracking-wider block">
            1. Gross Verified Visit
          </span>
          <div className="text-2xl font-extrabold text-[#0B1F33] font-mono mt-1">
            {formatRwf(grossRate)}
          </div>
          <span className="text-[11px] text-[#526173] mt-0.5 block">
            Guaranteed per verified entry
          </span>
        </div>

        {/* Minus Sign */}
        <div className="w-8 h-8 rounded-full bg-[#E2E8F0] text-[#526173] flex items-center justify-center shrink-0">
          <Minus className="w-4 h-4 stroke-[3]" />
        </div>

        {/* Step 2: Platform Clearing Fee */}
        <div className="w-full flex-1 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl p-4 text-center">
          <span className="text-[11px] font-bold text-[#8491A3] uppercase tracking-wider block">
            2. Platform Clearing Fee ({platformPct}%)
          </span>
          <div className="text-2xl font-extrabold text-[#DC2626] font-mono mt-1">
            - {formatRwf(platformFee)}
          </div>
          <span className="text-[11px] text-[#526173] mt-0.5 block">
            Network infra, TOTP & billing
          </span>
        </div>

        {/* Equal Sign */}
        <div className="w-8 h-8 rounded-full bg-[#28D17C]/20 text-[#008A4B] flex items-center justify-center shrink-0">
          <Equal className="w-4 h-4 stroke-[3]" />
        </div>

        {/* Step 3: Net Provider Payout */}
        <div className="w-full flex-1 bg-[#E9FAF2] border border-[#B7F1D2] rounded-xl p-4 text-center">
          <span className="text-[11px] font-bold text-[#008A4B] uppercase tracking-wider block">
            3. Net Payout to Provider
          </span>
          <div className="text-2xl font-extrabold text-[#008A4B] font-mono mt-1">
            {formatRwf(netRate)}
          </div>
          <span className="text-[11px] text-[#008A4B] font-semibold mt-0.5 block">
            Disbursed monthly on the 15th
          </span>
        </div>
      </div>

      {/* Rules & Safeguards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#FAFCFF]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F33]">
            <Clock className="w-4 h-4 text-[#3B82F6]" />
            <span>Anti-Passback Safeguard</span>
          </div>
          <p className="text-[11px] text-[#526173] mt-1.5 leading-relaxed">
            Beneficiaries are restricted to 1 check-in per 3 hours across the network. Prevents card-sharing and duplicate visits.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#FAFCFF]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F33]">
            <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
            <span>20-Min Validation Queue</span>
          </div>
          <p className="text-[11px] text-[#526173] mt-1.5 leading-relaxed">
            All check-in intents enter a 20-minute review queue where desk staff can reject unrecognized arrivals before settlement locks.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#FAFCFF]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F33]">
            <Receipt className="w-4 h-4 text-[#8B5CF6]" />
            <span>Guaranteed Co-Pay Clearing</span>
          </div>
          <p className="text-[11px] text-[#526173] mt-1.5 leading-relaxed">
            PolyFit collects co-pay deductions directly from employer payroll. Your facility receives the full agreed contractual rate.
          </p>
        </div>
      </div>
    </div>
  );
}
