'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  CreditCard,
  ArrowRight,
  X,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

interface SecurityAlertBannerProps {
  onOpenPayoutModal: () => void;
}

export function SecurityAlertBanner({ onOpenPayoutModal }: SecurityAlertBannerProps) {
  const { provider, dashboardData } = usePartner();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('polyfit_security_banner_dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polyfit_security_banner_dismissed', 'true');
    }
  };

  const isConfigured = dashboardData?.provider?.is_payout_configured ?? false;
  const bankDetails = provider?.bank_details;

  if (isConfigured) {
    const methodDesc =
      bankDetails?.payout_method === 'momo'
        ? `${bankDetails.momo_provider?.toUpperCase() || 'MTN'} MoMo (${bankDetails.momo_phone || bankDetails.momo_code || 'Verified'})`
        : `${bankDetails?.bank_name || 'Bank of Kigali'} (${bankDetails?.account_number ? `...${bankDetails.account_number.slice(-4)}` : 'Verified'})`;

    return (
      <div className="bg-[#E9FAF2] border border-[#B7F1D2] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#28D17C]/20 border border-[#28D17C]/40 flex items-center justify-center text-[#008A4B] shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#008A4B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0B1F33]">
                Disbursement Account Active
              </span>
              <span className="text-[10px] font-bold bg-[#28D17C] text-[#0B1F33] px-2 py-0.5 rounded-full">
                VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-[#008A4B] font-medium mt-0.5">
              Monthly payouts scheduled for the 15th via <span className="font-semibold">{methodDesc}</span>.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPayoutModal}
          className="self-start sm:self-auto text-xs font-semibold text-[#008A4B] hover:text-[#0B1F33] bg-white px-3 py-1.5 rounded-lg border border-[#B7F1D2] hover:bg-[#F8FAFC] transition-colors shrink-0"
        >
          Manage Payout Details
        </button>
      </div>
    );
  }

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] border border-[#F59E0B]/40 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs relative overflow-hidden animate-in fade-in duration-200">
      {/* Accent glow bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F59E0B]"></div>

      <div className="flex items-start sm:items-center gap-3 pl-1">
        <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center text-[#92400E] shrink-0 mt-0.5 sm:mt-0">
          <AlertTriangle className="w-5 h-5 text-[#B45309]" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#78350F]">
              Action Required: Verify Payout & Anti-Fraud Phone Alerts
            </span>
            <span className="text-[10px] font-bold bg-[#EF4444] text-white px-2 py-0.5 rounded-full animate-pulse">
              URGENT
            </span>
          </div>
          <p className="text-[11px] text-[#92400E] mt-0.5 leading-relaxed">
            Connect your Rwandan Bank account or MTN/Airtel MoMo Code to guarantee scheduled monthly settlements and real-time check-in fraud dispute notifications.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={onOpenPayoutModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B1F33] hover:bg-[#132D43] text-white text-xs font-bold transition-all shadow-xs active:scale-98"
        >
          <span>Verify Account</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-[#92400E] hover:text-[#78350F] hover:bg-[#F59E0B]/20 transition-colors"
          title="Dismiss notification"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
