'use client';

import React from 'react';
import {
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  Receipt,
  Sparkles,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { formatRwf } from '@/lib/invoice-pdf';

interface CommercialTermsCardProps {
  onOpenAmendmentModal: () => void;
}

export function CommercialTermsCard({ onOpenAmendmentModal }: CommercialTermsCardProps) {
  const { commercialConditions, provider } = usePartner();

  const contract = commercialConditions?.active_contract;
  const rate = contract?.per_visit_rate ?? 5000;
  const cap = contract?.monthly_cap ? `${contract.monthly_cap} visits / month` : 'Unlimited';
  const tierName = contract?.tier_classification || 'Tier 1 - Certified Network Facility';

  const formatHours = (hours: any) => {
    if (!hours) return 'Weekdays: 06:00 – 21:00 | Weekends: 08:00 – 18:00';
    if (typeof hours === 'string') return hours;
    return `Weekdays: ${hours.weekdays || '06:00 – 21:00'} | Weekends: ${hours.weekends || '08:00 – 18:00'}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs relative overflow-hidden">
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#E9FAF2]/60 via-transparent to-transparent pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1F4F8] relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1F33] text-[#28D17C] flex items-center justify-center shadow-sm shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8491A3] uppercase tracking-wider">
                Network Agreement
              </span>
              <span className="text-[10px] font-bold bg-[#E9FAF2] text-[#008A4B] px-2 py-0.5 rounded-full border border-[#B7F1D2]">
                ACTIVE CONTRACT
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0B1F33] tracking-tight mt-0.5">
              {tierName}
            </h3>
            <p className="text-xs text-[#526173]">
              Executed with PolyFit Aggregator Network for verified corporate beneficiary access.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAmendmentModal}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F33] hover:bg-[#132D43] text-white text-xs font-bold transition-all shadow-xs active:scale-98"
        >
          <span>Request Amendment</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#28D17C]" />
        </button>
      </div>

      {/* Commercial Terms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Term 1: Per-Visit Reimbursement */}
        <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
          <div className="text-xs text-[#8491A3] font-semibold flex items-center justify-between">
            <span>Reimbursement Rate</span>
            <Receipt className="w-4 h-4 text-[#008A4B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-[#0B1F33] font-mono tracking-tight">
              {formatRwf(rate)}
            </span>
            <span className="text-xs font-sans text-[#526173]">/ visit</span>
          </div>
          <p className="text-[11px] text-[#008A4B] font-medium mt-1">
            Guaranteed per verified check-in
          </p>
        </div>

        {/* Term 2: Monthly Visit Volume Cap */}
        <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
          <div className="text-xs text-[#8491A3] font-semibold flex items-center justify-between">
            <span>Monthly Payout Cap</span>
            <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="mt-2 text-xl font-bold text-[#0B1F33]">
            {cap}
          </div>
          <p className="text-[11px] text-[#526173] mt-1">
            Standard PolyFit corporate volume
          </p>
        </div>

        {/* Term 3: Access Hours Agreement */}
        <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
          <div className="text-xs text-[#8491A3] font-semibold flex items-center justify-between">
            <span>Agreed Access Hours</span>
            <Clock className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="mt-2 text-xs font-bold text-[#0B1F33] leading-snug">
            {formatHours(contract?.access_hours)}
          </div>
          <p className="text-[11px] text-[#526173] mt-1">
            Valid across all registered units
          </p>
        </div>

        {/* Term 4: Validity & Renewal */}
        <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
          <div className="text-xs text-[#8491A3] font-semibold flex items-center justify-between">
            <span>Contract Validity</span>
            <Calendar className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="mt-2 text-sm font-bold text-[#0B1F33]">
            Annual Auto-Renewal
          </div>
          <p className="text-[11px] text-[#526173] mt-1">
            Effective from: {contract?.effective_from || 'Sep 2026'}
          </p>
        </div>
      </div>
    </div>
  );
}
