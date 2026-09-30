'use client';

import React from 'react';
import {
  Check,
  X,
  Shield,
  Layers,
  Info,
  Sparkles,
  HelpCircle,
  Building2,
  Lock
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

export function BenefitTierMatrix() {
  const { commercialConditions, provider } = usePartner();
  const tiers = commercialConditions?.tier_access_matrix || [];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#F1F4F8]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0B1F33]">
              Minimum User Benefit Tier for Entry
            </h3>
            <p className="text-xs text-[#526173]">
              Transparent breakdown of corporate employee plans that qualify for verified check-in at your facility.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-[#526173] bg-[#F7F9FC] px-3 py-1 rounded-xl border border-[#E2E8F0] self-start sm:self-auto">
          Facility Category: <strong className="capitalize text-[#0B1F33]">{provider?.category || 'Gym'}</strong>
        </span>
      </div>

      {/* Table Display */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#8491A3] uppercase tracking-wider bg-[#F7F9FC]">
              <th className="py-3 px-4 rounded-l-xl">Corporate Plan Tier</th>
              <th className="py-3 px-4">Entry Permission</th>
              <th className="py-3 px-4">Employee Co-Pay</th>
              <th className="py-3 px-4">Access Rights & Facility Scope</th>
              <th className="py-3 px-4 rounded-r-xl text-right">Provider Settlement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F4F8] text-xs">
            {tiers.map((tier) => {
              const isEligible = tier.is_eligible_for_entry;

              return (
                <tr
                  key={tier.tier}
                  className={`hover:bg-[#F8FAFC] transition-colors ${
                    !isEligible ? 'opacity-70 bg-[#FAFCFF]' : ''
                  }`}
                >
                  {/* Tier Name */}
                  <td className="py-4 px-4 font-bold text-[#0B1F33]">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                          tier.tier === 'premium'
                            ? 'bg-[#0B1F33] text-[#28D17C]'
                            : tier.tier === 'standard'
                            ? 'bg-[#28D17C]/20 text-[#008A4B]'
                            : 'bg-[#F1F4F8] text-[#526173]'
                        }`}
                      >
                        {tier.tier.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div>{tier.tier_name}</div>
                        <span className="text-[10px] font-normal text-[#8491A3] block">
                          Tier code: {tier.tier}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Entry Permission Pill */}
                  <td className="py-4 px-4">
                    {isEligible ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Granted (Eligible)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Restricted</span>
                      </span>
                    )}
                  </td>

                  {/* Co-Pay */}
                  <td className="py-4 px-4">
                    <span className="font-mono font-semibold text-[#0B1F33]">
                      {tier.co_pay_percentage}%
                    </span>
                    <span className="text-[10px] text-[#8491A3] block">
                      {tier.co_pay_percentage === 0
                        ? '100% Employer Funded'
                        : 'Collected by PolyFit'}
                    </span>
                  </td>

                  {/* Description / Restriction */}
                  <td className="py-4 px-4 text-[#526173] max-w-xs">
                    <p className="line-clamp-2 leading-relaxed">
                      {tier.restriction_reason || tier.description}
                    </p>
                  </td>

                  {/* Settlement */}
                  <td className="py-4 px-4 text-right">
                    {isEligible ? (
                      <div>
                        <span className="font-mono font-bold text-[#008A4B] text-sm">
                          5,000 RWF
                        </span>
                        <span className="text-[10px] text-[#8491A3] block">Contract Guaranteed</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#8491A3] italic">No Entry</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Explanatory Callout */}
      <div className="mt-5 p-3.5 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#526173]">
        <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0B1F33]">Eligibility Enforcement at Reception:</strong> When a corporate beneficiary presents their dynamic QR pass or mobile check-in code, PolyFit automatically validates their plan tier against this matrix. Employees with restricted plans receive an immediate in-app prompt to upgrade.
        </div>
      </div>
    </div>
  );
}
