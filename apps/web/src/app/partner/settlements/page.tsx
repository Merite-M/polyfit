'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, Calendar, ArrowRight, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

export default function PartnerSettlementsPage() {
  const { provider, todaySummary } = usePartner();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">Settlements & Invoicing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight mt-1">
            Partner Settlement Statements
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Monthly provider payouts, automated visit reconciliation, and tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/partner/checkins"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors"
          >
            <span>Live Check-in Queue</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#28D17C]" />
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="text-xs text-[#8491A3] font-semibold">September 2026 Accrued Payout</div>
          <div className="text-2xl font-extrabold text-[#0B1F33] font-mono mt-1">
            2,450,000 <span className="text-xs font-sans text-[#8491A3]">RWF</span>
          </div>
          <div className="text-[11px] text-[#28D17C] font-semibold mt-1">
            490 verified visits @ 5,000 RWF
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="text-xs text-[#8491A3] font-semibold">Next Scheduled Payout</div>
          <div className="text-2xl font-extrabold text-[#0B1F33] mt-1">
            Oct 15, 2026
          </div>
          <div className="text-[11px] text-[#526173] mt-1">
            Closing cut-off: Oct 2, 23:59 CAT
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="text-xs text-[#8491A3] font-semibold">Settlement Bank Account</div>
          <div className="text-sm font-bold text-[#0B1F33] mt-1">
            Bank of Kigali (BK)
          </div>
          <div className="text-[11px] font-mono text-[#8491A3] mt-0.5">
            00040-0692140-19 • RWF
          </div>
        </div>
      </div>

      {/* Feature Link to PF-94 */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-5 flex items-start gap-3">
        <Receipt className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#1E3A8A]">
            Comprehensive Settlement Engine (Linear Issue PF-94)
          </h4>
          <p className="text-xs text-[#1E40AF] leading-relaxed">
            Detailed itemized settlement breakdowns, tax withholding invoices (Rwanda Revenue Authority VAT / WHT),
            and automated MoMo / Bank disbursement reports are scheduled for release under PF-94. Real-time visit counts
            are live right now in Check-in Operations.
          </p>
        </div>
      </div>
    </div>
  );
}
