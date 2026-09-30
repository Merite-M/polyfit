'use client';

import React from 'react';
import {
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  Info,
  CheckCircle2
} from 'lucide-react';
import { WizardLocationState, RWANDAN_BANKS } from './types';

interface Step10Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

export function Step10PayoutSetup({ state, onChange }: Step10Props) {
  const isBank = state.payout_method === 'bank';

  const handleBankSelect = (bankName: string) => {
    const selected = RWANDAN_BANKS.find((b) => b.name === bankName);
    onChange({
      bank_name: bankName,
      swift_code: selected ? selected.swift : '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9FAF2] text-[#008A4B] text-xs font-bold uppercase tracking-wider mb-2">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Step 10 of 11 • Commercial Settlement Rails</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          Monthly Settlement Payout Account
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          PolyFit automatically closes monthly visits on the last day of each calendar month and issues settlements directly to your Rwandan Bank Account or MTN MoMo / Airtel Money merchant code.
        </p>
      </div>

      {/* Payout Channel Selector (Bank vs Mobile Money) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bank Option */}
        <div
          onClick={() => onChange({ payout_method: 'bank' })}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            isBank
              ? 'bg-[#E9FAF2] border-2 border-[#28D17C] shadow-xs'
              : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-[#28D17C]">
              <Building2 className="w-4 h-4" />
            </div>
            {isBank && <CheckCircle2 className="w-5 h-5 text-[#28D17C]" />}
          </div>
          <h3 className="text-sm font-bold text-[#0B1F33]">Rwandan Commercial Bank</h3>
          <p className="text-xs text-[#526173] mt-0.5">
            EFT / Direct Transfer (Bank of Kigali, I&M, Equity, BPR, Ecobank)
          </p>
        </div>

        {/* Mobile Money Option */}
        <div
          onClick={() => onChange({ payout_method: 'momo' })}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            !isBank
              ? 'bg-[#E9FAF2] border-2 border-[#28D17C] shadow-xs'
              : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-[#F59E0B]">
              <Smartphone className="w-4 h-4" />
            </div>
            {!isBank && <CheckCircle2 className="w-5 h-5 text-[#28D17C]" />}
          </div>
          <h3 className="text-sm font-bold text-[#0B1F33]">MTN MoMo / Airtel Money</h3>
          <p className="text-xs text-[#526173] mt-0.5">
            Instant merchant code payout for fast liquidity
          </p>
        </div>
      </div>

      {/* Detail Input Container */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4 shadow-xs">
        {isBank ? (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider">
              Bank Account Details (RWF)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Bank Name <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={state.bank_name}
                  onChange={(e) => handleBankSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
                >
                  {RWANDAN_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  SWIFT / BIC Code
                </label>
                <input
                  type="text"
                  readOnly
                  value={state.swift_code}
                  className="w-full px-3 py-2 bg-[#F1F4F8] border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#526173]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Account Name / Registered Business <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. FitLife Kigali Ltd"
                  value={state.account_name}
                  onChange={(e) => onChange({ account_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Account Number (IBAN / Local Format) <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="00040-06912345-67"
                  value={state.account_number}
                  onChange={(e) => onChange({ account_number: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider">
              Mobile Money Merchant Credentials
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Telco Network <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={state.momo_provider}
                  onChange={(e) => onChange({ momo_provider: e.target.value as 'mtn' | 'airtel' })}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
                >
                  <option value="mtn">MTN Mobile Money Rwanda (MoMo)</option>
                  <option value="airtel">Airtel Money Rwanda</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Merchant Paybill / Code <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 182*8*1*123456#"
                  value={state.momo_code}
                  onChange={(e) => onChange({ momo_code: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Merchant Owner Registered Phone
                </label>
                <input
                  type="tel"
                  placeholder="+250 788 123 456"
                  value={state.momo_phone}
                  onChange={(e) => onChange({ momo_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tax Identification (RRA TIN) */}
        <div className="pt-4 border-t border-[#E2E8F0]">
          <div className="max-w-md">
            <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
              Rwanda Revenue Authority (RRA) TIN Number
            </label>
            <input
              type="text"
              placeholder="e.g. 100 234 567"
              value={state.tax_id}
              onChange={(e) => onChange({ tax_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
            />
            <p className="text-[11px] text-[#8491A3] mt-1">
              Required for automated monthly credit note VAT & withholding certificates.
            </p>
          </div>
        </div>

        {/* Security & Guarantee Chip */}
        <div className="bg-[#E9FAF2] border border-[#B7F1D2] rounded-lg p-3 flex items-center gap-2.5 text-xs text-[#065F46]">
          <ShieldCheck className="w-4 h-4 text-[#28D17C] shrink-0" />
          <span>
            Settlement SLA: All verified check-ins are closed on the last calendar day and paid out on the 15th via direct clearing.
          </span>
        </div>
      </div>
    </div>
  );
}
