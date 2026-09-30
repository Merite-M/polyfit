'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertOctagon, ChevronDown, ChevronUp, Flag } from 'lucide-react';

interface AntiMisuseBannerProps {
  onOpenDisputeModal?: () => void;
}

export function AntiMisuseBanner({ onOpenDisputeModal }: AntiMisuseBannerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#0B1F33] text-white rounded-xl border border-[#21405A] px-4 py-2.5 mb-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-xs text-white shrink-0">
              Anti-Misuse Policy Active:
            </span>
            <p className="text-xs text-[#CBD5E1] truncate font-normal">
              Pass-sharing, identity mismatch, and infractions are reviewed directly with employer HR.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-[#8491A3] hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-[#132D43]"
          >
            <span>{expanded ? 'Hide rules' : 'Policy rules'}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={onOpenDisputeModal}
            className="px-2.5 py-1 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-98"
          >
            <Flag className="w-3 h-3" />
            <span>Flag Misuse</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#21405A] grid sm:grid-cols-3 gap-3 text-xs text-[#8491A3] animate-in fade-in duration-200">
          <div className="p-2.5 rounded-lg bg-[#132D43]/60 border border-[#21405A]/60">
            <strong className="text-white block mb-0.5">Pass Sharing & Identity Fraud</strong>
            Beneficiary phone or TOTP passed to a colleague or family member. Photo must match visitor.
          </div>
          <div className="p-2.5 rounded-lg bg-[#132D43]/60 border border-[#21405A]/60">
            <strong className="text-white block mb-0.5">Tier & Category Overreach</strong>
            Attempting to access premium facilities or restricted amenities outside of contracted corporate tier.
          </div>
          <div className="p-2.5 rounded-lg bg-[#132D43]/60 border border-[#21405A]/60">
            <strong className="text-white block mb-0.5">Facility Policy Violations</strong>
            Unruly behavior, equipment damage, or refusing counter check-in verification procedures.
          </div>
        </div>
      )}
    </div>
  );
}
