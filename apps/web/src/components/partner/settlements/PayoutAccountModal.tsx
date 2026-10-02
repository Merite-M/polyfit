'use client';

import React, { useEffect } from 'react';
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
import { useDialog } from '@/lib/use-dialog';

interface PayoutAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

import { RWANDAN_BANKS } from '@/lib/constants';

export function PayoutAccountModal({ isOpen, onClose, onSuccess }: PayoutAccountModalProps) {
  const { provider, updatePayoutDetails } = usePartner();

  const [payoutMethod, setPayoutMethod] = React.useState<'bank' | 'momo'>('bank');
  const [bankName, setBankName] = React.useState('Bank of Kigali (BK)');
  const [accountName, setAccountName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [swiftCode, setSwiftCode] = React.useState('BOKRRWRW');
  const [momoProvider, setMomoProvider] = React.useState<'mtn' | 'airtel'>('mtn');
  const [momoCode, setMomoCode] = React.useState('');
  const [momoPhone, setMomoPhone] = React.useState('');
  const [taxId, setTaxId] = React.useState('');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Native <dialog> ref — driven by useDialog hook
  const dialogRef = useDialog(isOpen, onClose);

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
    /* Native <dialog> — top-layer, Escape key, focus trap, ::backdrop all native.
       .pf-native-dialog drives @starting-style entry + allow-discrete exit animations. */
    <dialog
      ref={dialogRef}
      className="pf-native-dialog w-full overflow-hidden"
      aria-labelledby="payout-modal-title"
      onClose={onClose}
    >
      {/* Top Emerald Header Accent Bar */}
      <div className="h-1.5 bg-gradient-to-r from-accent to-secondary" />

      {/* Modal Header */}
      <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-subtle px-2 py-0.5 rounded-full border border-accent/20">
              Finance &amp; Payouts
            </span>
            <span className="text-[11px] text-subdued font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-accent" /> 256-bit Encrypted
            </span>
          </div>
          <h2 id="payout-modal-title" className="text-lg sm:text-xl font-bold text-primary tracking-tight mt-1">
            Settlement Payout Settings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your Rwandan bank account or Mobile Money merchant code for monthly settlement disbursements.
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-subdued hover:text-primary hover:bg-muted transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-xs text-error font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-accent-subtle border border-accent/20 text-xs text-success font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
            <span>Payout settings saved! Monthly disbursements will route to this destination.</span>
          </div>
        )}

        {/* Method Segmented Toggle */}
        <div>
          <label className="block text-xs font-bold text-primary mb-2 uppercase tracking-wider">
            Disbursement Channel
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPayoutMethod('bank')}
              className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                payoutMethod === 'bank'
                  ? 'border-accent bg-accent-subtle/60 text-primary ring-1 ring-accent'
                  : 'border-border bg-muted text-muted-foreground hover:bg-card'
              }`}
            >
              <Building2 className={`w-4 h-4 ${payoutMethod === 'bank' ? 'text-success' : 'text-subdued'}`} />
              <span>Rwandan Bank Account</span>
            </button>

            <button
              type="button"
              onClick={() => setPayoutMethod('momo')}
              className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                payoutMethod === 'momo'
                  ? 'border-accent bg-accent-subtle/60 text-primary ring-1 ring-accent'
                  : 'border-border bg-muted text-muted-foreground hover:bg-card'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${payoutMethod === 'momo' ? 'text-success' : 'text-subdued'}`} />
              <span>Mobile Money (MoMo)</span>
            </button>
          </div>
        </div>

        {/* Bank Fields */}
        {payoutMethod === 'bank' ? (
          <div className="space-y-3.5 bg-muted p-4 rounded-xl border border-border">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Bank Name (Rwanda)
              </label>
              <select
                value={bankName}
                onChange={(e) => handleBankChange(e.target.value)}
                className="w-full text-xs font-semibold text-primary bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
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
                <label className="block text-xs font-semibold text-primary mb-1">
                  Beneficiary Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FitLife Gym Ltd"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full text-xs font-medium text-primary bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Account Number / IBAN
                </label>
                <input
                  type="text"
                  required
                  placeholder="00040-0692140-19"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full text-xs font-mono font-medium text-primary bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                SWIFT / Branch Code
              </label>
              <input
                type="text"
                readOnly
                value={swiftCode}
                className="w-full text-xs font-mono text-muted-foreground bg-muted border border-border rounded-lg px-3 py-2 cursor-not-allowed"
              />
            </div>
          </div>
        ) : (
          /* Mobile Money Fields */
          <div className="space-y-3.5 bg-muted p-4 rounded-xl border border-border">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Mobile Money Network
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="momoProvider"
                    checked={momoProvider === 'mtn'}
                    onChange={() => setMomoProvider('mtn')}
                    className="text-accent focus:ring-accent"
                  />
                  <span>MTN MoMo Business</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="momoProvider"
                    checked={momoProvider === 'airtel'}
                    onChange={() => setMomoProvider('airtel')}
                    className="text-accent focus:ring-accent"
                  />
                  <span>Airtel Money Merchant</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Merchant / Pay Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 184920"
                  value={momoCode}
                  onChange={(e) => setMomoCode(e.target.value)}
                  className="w-full text-xs font-mono font-medium text-primary bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Registered Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+250 788 123 456"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  className="w-full text-xs font-mono font-medium text-primary bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tax Compliance (RRA TIN) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-primary">
              Rwanda Revenue Authority (RRA) Tax Identification Number (TIN)
            </label>
            <span className="text-[10px] text-success font-semibold flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3 text-accent" /> RRA Compliant
            </span>
          </div>
          <input
            type="text"
            placeholder="e.g. 108392019"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className="w-full text-xs font-mono font-semibold text-primary bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="text-[11px] text-subdued mt-1">
            Required by Rwandan tax regulations for 15% withholding tax clearance on monthly disbursements.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-primary font-semibold text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs shadow-xs transition-all flex items-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving Details...</span>
            ) : (
              <span>Save Payout Destination</span>
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
