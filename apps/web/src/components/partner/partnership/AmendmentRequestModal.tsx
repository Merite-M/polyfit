'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  DollarSign
} from 'lucide-react';
import { usePartner, AmendmentRequestPayload } from '@/contexts/PartnerContext';

interface AmendmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AmendmentRequestModal({ isOpen, onClose }: AmendmentRequestModalProps) {
  const { provider, commercialConditions, submitAmendmentRequest } = usePartner();

  const [requestType, setRequestType] = useState<AmendmentRequestPayload['request_type']>('rate_review');
  const [currentRate, setCurrentRate] = useState<number>(commercialConditions?.active_contract?.per_visit_rate || 5000);
  const [requestedRate, setRequestedRate] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(provider?.contact_email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!justification.trim()) {
      setErrorMessage('Please provide a justification or proposal description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAmendmentRequest({
        contract_id: commercialConditions?.active_contract?.id,
        request_type: requestType,
        current_rate: currentRate,
        requested_rate: requestedRate ? parseFloat(requestedRate) : undefined,
        justification: justification.trim(),
        contact_phone: phone.trim() || undefined,
        contact_email: email.trim() || undefined
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        setErrorMessage(res.error || 'Failed to submit request');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="amendment-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-[#F7F9FC] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1F33] text-[#28D17C] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="amendment-modal-title" className="text-base font-bold text-[#0B1F33]">
                Contract Amendment & Commercial Inquiry
              </h3>
              <p className="text-xs text-[#526173]">
                Submit term adjustments directly to PolyFit Partner Operations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8491A3] hover:text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E9FAF2] text-[#008A4B] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-bold text-[#0B1F33]">
              Amendment Request Submitted!
            </h4>
            <p className="text-xs text-[#526173] max-w-sm mx-auto">
              Your inquiry has been submitted to PolyFit Partner Operations. Our team will review the proposal and reply within 1–2 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Request Type */}
            <div>
              <label className="block text-xs font-bold text-[#0B1F33] mb-1.5">
                Inquiry / Request Type
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as any)}
                className="w-full text-xs rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] p-2.5 font-medium text-[#0B1F33] focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
              >
                <option value="rate_review">Rate Review (Reimbursement Rate Increase / Adjustment)</option>
                <option value="capacity_expansion">Capacity Expansion (Higher volume cap or new amenities)</option>
                <option value="tier_upgrade">Tier Upgrade (Request qualification for Premium / Executive tiers)</option>
                <option value="terms_inquiry">General Commercial Terms & Conditions Inquiry</option>
              </select>
            </div>

            {/* Rate inputs if rate_review */}
            {requestType === 'rate_review' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#526173] mb-1">
                    Current Rate (RWF)
                  </label>
                  <input
                    type="number"
                    value={currentRate}
                    disabled
                    className="w-full text-xs rounded-xl bg-[#F1F4F8] border border-[#E2E8F0] p-2.5 font-mono font-bold text-[#526173]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                    Proposed Rate (RWF)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 6000"
                    value={requestedRate}
                    onChange={(e) => setRequestedRate(e.target.value)}
                    className="w-full text-xs rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] p-2.5 font-mono font-bold text-[#0B1F33] focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                  />
                </div>
              </div>
            )}

            {/* Justification Textarea */}
            <div>
              <label className="block text-xs font-bold text-primary mb-1">
                Proposal Details & Justification <span className="text-error">*</span>
              </label>
              <textarea
                placeholder="Explain the rationale (e.g. new Olympic pool added, increased operational overhead, expansion to new branch)..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="pf-textarea-sm w-full text-xs rounded-xl bg-muted border border-border p-2.5 text-foreground placeholder:text-subdued focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#526173] mb-1">
                  Manager WhatsApp / Phone
                </label>
                <input
                  type="text"
                  placeholder="+250 788 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] p-2 text-[#0B1F33] focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#526173] mb-1">
                  Notification Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] p-2 text-[#0B1F33] focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#F1F4F8] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#526173] hover:text-[#0B1F33] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F33] hover:bg-[#132D43] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#28D17C]" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Inquiry'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
