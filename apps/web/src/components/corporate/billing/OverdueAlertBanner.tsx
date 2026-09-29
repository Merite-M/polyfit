"use client";

import React from "react";
import { AlertTriangle, ArrowRight, ShieldAlert, CreditCard } from "lucide-react";
import { formatRwf } from "@/lib/invoice-pdf";

interface OverdueAlertBannerProps {
  overdueCount: number;
  overdueAmount: number;
  oldestInvoiceNumber?: string;
  onPayNow: () => void;
}

export function OverdueAlertBanner({
  overdueCount,
  overdueAmount,
  oldestInvoiceNumber,
  onPayNow,
}: OverdueAlertBannerProps) {
  if (overdueCount <= 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#DC2626]/10 via-[#EF4444]/5 to-transparent border border-[#DC2626]/30 p-5 mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#DC2626]/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#DC2626] text-white">
                Payment Overdue
              </span>
              <span className="text-xs text-[#DC2626] font-semibold">
                {overdueCount} Statement{overdueCount > 1 ? "s" : ""} Past Due
              </span>
            </div>
            <h4 className="text-sm font-bold text-[#0B1F33] mt-1">
              Outstanding Consolidated Balance: {formatRwf(overdueAmount)}
            </h4>
            <p className="text-xs text-[#526173] mt-0.5 max-w-2xl leading-relaxed">
              Statement {oldestInvoiceNumber ? `(${oldestInvoiceNumber})` : ""} has exceeded standard Net-30 settlement terms.
              Please complete transfer via Bank RTGS or MTN MoMo Corporate Merchant Code to avoid facility access interruptions for your employees.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
          <button
            onClick={onPayNow}
            className="px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Settle Outstanding Balance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
