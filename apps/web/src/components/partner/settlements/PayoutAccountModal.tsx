'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock
} from 'lucide-react';
import { usePartner, ProviderBankDetails } from '@/contexts/PartnerContext';

interface PayoutAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

import { RWANDAN_BANKS } from '@/lib/constants';

export function PayoutAccountModal({ isOpen, onClose, onSuccess }: PayoutAccountModalProps) {
  const { provider, updatePayoutDetails } = usePartner();

  const [payoutMethod, setPayoutMethod] = useState<'bank' | 'momo'>('bank');
  const [bankName, setBankName] = useState('Bank of Kigali (BK)');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('BOKRRWRW');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [momoCode, setMomoCode] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [taxId, setTaxId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when provider data is ready or modal opens
  useEffect(() => {
    if (provider) {
      setTaxId(provider.tax_id || '108392019');
      const b = provider.bank_details;
      if (b) {
        setPayoutMethod(b.payout_method || 'bank');
        if (b.bank_name) setBankName(b.bank_name);
        if (b.account_name) setAccountName(b.account_name);
        if (b.account_number) setAccountNumber(b.account_number);
        if (b.swift_code) setSwiftCode(b.swift_code);
        if (b.momo_provider === 'airtel') setMomoProvider('airtel');
        if (b.momo_code) setMomoCode(b.momo_code);
        if (b.momo_phone) setMomoPhone(b.momo_phone);
      } else {
        // Fallback default for Kigali demo
        setAccountName(provider.name || 'FitLife Ltd');
        setAccountNumber('00040-0692140-19');
      }
    }
  }, [provider, isOpen]);

  if (!isOpen) return null;

  const handleBankChange = (name: string) => {
    setBankName(name);
    const found = RWANDAN_BANKS.find((b) => b.name === name);
    if (found) setSwiftCode(found.swift);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (payoutMethod === 'bank' && (!accountNumber || !accountName)) {
      setErrorMsg('Please provide a valid account name and account number.');
      return;
    }

    if (payoutMethod === 'momo' && !momoCode && !momoPhone) {
      setErrorMsg('Please provide an MTN MoMo Business Code or Phone Number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bankDetailsPayload: ProviderBankDetails = {
        payout_method: payoutMethod,
        bank_name: payoutMethod === 'bank' ? bankName : undefined,
        account_name: payoutMethod === 'bank' ? accountName : undefined,
        account_number: payoutMethod === 'bank' ? accountNumber : undefined,
        swift_code: payoutMethod === 'bank' ? swiftCode : undefined,
        momo_provider: payoutMethod === 'momo' ? momoProvider : undefined,
        momo_code: payoutMethod === 'momo' ? momoCode : undefined,
        momo_phone: payoutMethod === 'momo' ? momoPhone : undefined
      };

      await updatePayoutDetails({
        tax_id: taxId.trim(),
        bank_details: bankDetailsPayload
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 900);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update payout settings';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1F33]/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Top Emerald Header Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#28D17C] to-[#00D2B4]" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#28D17C] bg-[#E9FAF2] px-2 py-0.5 rounded-full border border-[#B7F1D2]">
                Finance & Payouts
              </span>
              <span className="text-[11px] text-[#8491A3] font-medium flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#28D17C]" /> 256-bit Encrypted
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0B1F33] tracking-tight mt-1">
              Settlement Payout Settings
            </h2>
            <p className="text-xs text-[#526173] mt-0.5">
              Configure your Rwandan bank account or Mobile Money merchant code for monthly settlement disbursements.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8491A3] hover:text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#DC2626] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-[#E9FAF2] border border-[#B7F1D2] text-xs text-[#008A4B] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#28D17C] flex-shrink-0" />
              <span>Payout settings saved! Monthly disbursements will route to this destination.</span>
            </div>
          )}

          {/* Method Segmented Toggle */}
          <div>
            <label className="block text-xs font-bold text-[#0B1F33] mb-2 uppercase tracking-wider">
              Disbursement Channel
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPayoutMethod('bank')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                  payoutMethod === 'bank'
                    ? 'border-[#28D17C] bg-[#E9FAF2]/60 text-[#0B1F33] ring-1 ring-[#28D17C]'
                    : 'border-[#E2E8F0] bg-[#F7F9FC] text-[#526173] hover:bg-white'
                }`}
              >
                <Building2 className={`w-4 h-4 ${payoutMethod === 'bank' ? 'text-[#008A4B]' : 'text-[#8491A3]'}`} />
                <span>Rwandan Bank Account</span>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('momo')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                  payoutMethod === 'momo'
                    ? 'border-[#28D17C] bg-[#E9FAF2]/60 text-[#0B1F33] ring-1 ring-[#28D17C]'
                    : 'border-[#E2E8F0] bg-[#F7F9FC] text-[#526173] hover:bg-white'
                }`}
              >
                <Smartphone className={`w-4 h-4 ${payoutMethod === 'momo' ? 'text-[#008A4B]' : 'text-[#8491A3]'}`} />
                <span>Mobile Money (MoMo)</span>
              </button>
            </div>
          </div>

          {/* Bank Fields */}
          {payoutMethod === 'bank' ? (
            <div className="space-y-3.5 bg-[#F7F9FC] p-4 rounded-xl border border-[#E2E8F0]">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Bank Name (Rwanda)
                </label>
                <select
                  value={bankName}
                  onChange={(e) => handleBankChange(e.target.value)}
                  className="w-full text-xs font-semibold text-[#0B1F33] bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                >
                  {RWANDAN_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                    Beneficiary Account Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FitLife Gym Ltd"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full text-xs font-medium text-[#0B1F33] bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                    Account Number / IBAN
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00040-0692140-19"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full text-xs font-mono font-medium text-[#0B1F33] bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  SWIFT / Branch Code
                </label>
                <input
                  type="text"
                  readOnly
                  value={swiftCode}
                  className="w-full text-xs font-mono text-[#526173] bg-[#F1F4F8] border border-[#E2E8F0] rounded-lg px-3 py-2 cursor-not-allowed"
                />
              </div>
            </div>
          ) : (
            /* Mobile Money Fields */
            <div className="space-y-3.5 bg-[#F7F9FC] p-4 rounded-xl border border-[#E2E8F0]">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Mobile Money Network
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#0B1F33] cursor-pointer">
                    <input
                      type="radio"
                      name="momoProvider"
                      checked={momoProvider === 'mtn'}
                      onChange={() => setMomoProvider('mtn')}
                      className="text-[#28D17C] focus:ring-[#28D17C]"
                    />
                    <span>MTN MoMo Business</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-[#0B1F33] cursor-pointer">
                    <input
                      type="radio"
                      name="momoProvider"
                      checked={momoProvider === 'airtel'}
                      onChange={() => setMomoProvider('airtel')}
                      className="text-[#28D17C] focus:ring-[#28D17C]"
                    />
                    <span>Airtel Money Merchant</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                    Merchant / Pay Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 184920"
                    value={momoCode}
                    onChange={(e) => setMomoCode(e.target.value)}
                    className="w-full text-xs font-mono font-medium text-[#0B1F33] bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+250 788 123 456"
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    className="w-full text-xs font-mono font-medium text-[#0B1F33] bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tax Compliance (RRA TIN) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#0B1F33]">
                Rwanda Revenue Authority (RRA) Tax Identification Number (TIN)
              </label>
              <span className="text-[10px] text-[#008A4B] font-semibold flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-[#28D17C]" /> RRA Compliant
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. 108392019"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full text-xs font-mono font-semibold text-[#0B1F33] bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
            />
            <p className="text-[11px] text-[#8491A3] mt-1">
              Required by Rwandan tax regulations for 15% withholding tax clearance on monthly disbursements.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F1F4F8] text-[#0B1F33] font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs shadow-xs transition-all flex items-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving Details...</span>
              ) : (
                <span>Save Payout Destination</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
