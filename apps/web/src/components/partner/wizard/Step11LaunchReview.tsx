'use client';

import React from 'react';
import {
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
  CreditCard,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { WizardLocationState, DAYS_OF_WEEK } from './types';

interface Step11Props {
  state: WizardLocationState;
  onLaunch: () => void;
  isLaunching: boolean;
  onGoToStep: (step: number) => void;
}

export function Step11LaunchReview({ state, onLaunch, isLaunching, onGoToStep }: Step11Props) {
  // Verification Checklist Items
  const checkItems = [
    {
      title: 'Facility Branch Identity',
      valid: Boolean(state.name && state.address),
      step: 1,
      summary: `${state.name || 'Unnamed'} • ${state.address || 'Missing address'}`,
    },
    {
      title: 'Operating Hours & Shifts',
      valid: Object.values(state.operating_hours).some((d) => !d.is_closed && d.shifts.length > 0),
      step: 1,
      summary: 'Configured with split-shift support',
    },
    {
      title: 'Contact Channels',
      valid: Boolean(state.phone_number || state.whatsapp_number),
      step: 2,
      summary: `Phone: ${state.phone_country_code} ${state.phone_number} • WhatsApp active`,
    },
    {
      title: 'Guidelines & Anti-Retail Rules',
      valid: Boolean((state.description || '').length >= 20),
      step: 3,
      summary: 'Verified zero retail price mentions',
    },
    {
      title: 'Wellness Amenities',
      valid: (state.amenities || []).length >= 1,
      step: 5,
      summary: `${(state.amenities || []).length} amenities selected across network categories`,
    },
    {
      title: 'Visual Assets (Logo & Cover Hero)',
      valid: Boolean(state.cover_url),
      step: 7,
      summary: 'Hero cover and entrance photos uploaded',
    },
    {
      title: 'Settlement Account',
      valid: Boolean(
        (state.payout_method === 'bank' && state.account_number) ||
          (state.payout_method === 'momo' && state.momo_code)
      ),
      step: 10,
      summary:
        state.payout_method === 'bank'
          ? `${state.bank_name} (${state.account_number || 'Pending'})`
          : `${state.momo_provider.toUpperCase()} MoMo (${state.momo_code || 'Pending'})`,
    },
  ];

  const allValid = checkItems.every((i) => i.valid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9FAF2] text-[#008A4B] text-xs font-bold uppercase tracking-wider mb-2">
          <Rocket className="w-3.5 h-3.5" />
          <span>Step 11 of 11 • Review & Network Activation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          Final Verification & Confirm Launch
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          Review your facility card and operational checklist. Once confirmed, your venue will immediately be published into the PolyFit Corporate Network directory.
        </p>
      </div>

      {/* Readiness Status Box */}
      <div
        className={`rounded-xl border p-5 ${
          allValid
            ? 'bg-[#E9FAF2]/80 border-[#28D17C] text-[#065F46]'
            : 'bg-[#FFFBEB] border-[#F59E0B] text-[#92400E]'
        }`}
      >
        <div className="flex items-center gap-3">
          {allValid ? (
            <div className="w-10 h-10 rounded-full bg-[#28D17C] text-[#0B1F33] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-sm sm:text-base">
              {allValid ? 'Facility is Ready for Network Launch!' : 'Missing Required Items Before Launch'}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              {allValid
                ? 'All mandatory operational hours, photos, guidelines, and settlement rails are verified.'
                : 'Please review the highlighted steps below to complete onboarding.'}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] shadow-xs">
        {checkItems.map((item, idx) => (
          <div
            key={idx}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3">
              {item.valid ? (
                <CheckCircle2 className="w-5 h-5 text-[#28D17C] shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />
              )}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0B1F33]">{item.title}</h4>
                <p className="text-xs text-[#526173]">{item.summary}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onGoToStep(item.step)}
              className="text-xs font-semibold text-[#008A4B] hover:text-[#0B1F33] underline self-end sm:self-auto cursor-pointer"
            >
              Edit in Step {item.step}
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation & Launch Action */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-[#526173]">
          <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
          <span>
            By confirming, you agree to accept verified PolyFit corporate beneficiaries under your master aggregator service agreement.
          </span>
        </div>

        <button
          type="button"
          onClick={onLaunch}
          disabled={isLaunching || !allValid}
          className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all ${
            isLaunching || !allValid
              ? 'bg-[#CBD5E1] text-[#64748B] cursor-not-allowed'
              : 'bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] hover:scale-[1.01] active:scale-98 cursor-pointer'
          }`}
        >
          {isLaunching ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-[#0B1F33] border-t-transparent animate-spin" />
              <span>Publishing Facility to Network Directory...</span>
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              <span>Confirm & Launch Facility to Network</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
