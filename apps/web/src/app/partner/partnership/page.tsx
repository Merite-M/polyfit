'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  ScanLine,
  RefreshCw,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { CommercialTermsCard } from '@/components/partner/partnership/CommercialTermsCard';
import { BenefitTierMatrix } from '@/components/partner/partnership/BenefitTierMatrix';
import { PaymentCalculationExplainer } from '@/components/partner/partnership/PaymentCalculationExplainer';
import { AmendmentRequestModal } from '@/components/partner/partnership/AmendmentRequestModal';

export default function PartnerPartnershipPage() {
  const { provider, commercialConditions, refreshCommercialConditions } = usePartner();
  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCommercialConditions();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">Partnership Hub</span>
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight">
              Commercial Conditions & Contract Terms
            </h1>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#008A4B]" />
              Signed & Active
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Transparent view of your network agreement, reimbursement rates, benefit tier access, and settlement rules.
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleRefresh}
            title="Refresh contract terms"
            className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#526173] hover:text-[#0B1F33] transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#28D17C]' : ''}`} />
          </button>

          <button
            onClick={() => setAmendmentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0B1F33] text-xs font-bold border border-[#E2E8F0] transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-[#526173]" />
            <span>Request Amendment</span>
          </button>

          <Link
            href="/partner/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F33] hover:bg-[#132D43] text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Overview Hub</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#28D17C]" />
          </Link>
        </div>
      </div>

      {/* Navigation Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-px">
        <Link
          href="/partner/dashboard"
          className="px-4 py-2 text-xs font-semibold text-[#526173] hover:text-[#0B1F33] transition-colors flex items-center gap-2"
        >
          <span>Home Overview & Analytics</span>
        </Link>
        <Link
          href="/partner/partnership"
          className="px-4 py-2 text-xs font-bold text-[#0B1F33] border-b-2 border-[#28D17C] -mb-px flex items-center gap-2"
        >
          <span>Commercial Conditions & Contract Terms</span>
          <span className="text-[10px] font-bold bg-[#E9FAF2] text-[#008A4B] px-1.5 py-0.2 rounded-full border border-[#B7F1D2]">
            Wellhub Tour
          </span>
        </Link>
      </div>

      {/* Active Contract Terms Summary */}
      <CommercialTermsCard onOpenAmendmentModal={() => setAmendmentModalOpen(true)} />

      {/* Minimum Benefit Tier Matrix */}
      <BenefitTierMatrix />

      {/* Payment Calculation Explainer Formula */}
      <PaymentCalculationExplainer />

      {/* Amendment Request Modal */}
      <AmendmentRequestModal
        isOpen={amendmentModalOpen}
        onClose={() => setAmendmentModalOpen(false)}
      />
    </div>
  );
}
