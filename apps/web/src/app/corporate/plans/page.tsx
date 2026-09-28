"use client";

import React from "react";
import Link from "next/link";
import { Layers, ArrowLeft } from "lucide-react";

export default function PlansPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 text-xs text-[#8491A3] mb-4">
        <Link href="/corporate" className="hover:text-[#0B1F33] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1F33] font-semibold">Benefit Plans</span>
      </div>

      <div className="pb-6 border-b border-[#E2E8F0]">
        <h1 className="text-2xl font-bold text-[#0B1F33]">Corporate Benefit Plans</h1>
        <p className="text-xs text-[#526173] mt-1">
          Configure subsidy tiers, monthly visit quotas, and co-pay rules for your workforce.
        </p>
      </div>

      <div className="mt-8 p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-[#E0F9F5] text-[#00D2B4] flex items-center justify-center mx-auto mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#0B1F33]">Upcoming: Issue PF-91</h2>
        <p className="text-xs text-[#526173] mt-2 leading-relaxed">
          The Benefit Plan Builder with multi-tier subsidy allocations and co-pay rules is scheduled under ticket PF-91.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/corporate"
            className="px-4 py-2 rounded-xl bg-[#28D17C] text-[#0B1F33] font-semibold text-xs hover:bg-[#22BC6E] transition-colors"
          >
            Return to Dashboard Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
