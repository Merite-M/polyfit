'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  // Synchronize native <dialog> element
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Modern Web Guidance fallback for light-dismiss
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if ("closedBy" in HTMLDialogElement.prototype) return;
    if (e.target !== dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isInside =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInside) {
      onClose();
    }
  };

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onClose();
  };

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
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      closedby="any"
      className="pf-native-dialog p-0 bg-transparent text-foreground"
      aria-labelledby="amendment-modal-title"
    >
      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-modal max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 id="amendment-modal-title" className="text-base font-bold text-foreground">
                Contract Amendment & Commercial Inquiry
              </h3>
              <p className="text-xs text-muted-foreground">
                Submit term adjustments directly to PolyFit Partner Operations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent-subtle text-accent-foreground flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Amendment Request Submitted!
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your inquiry has been submitted to PolyFit Partner Operations. Our team will review the proposal and reply within 1–2 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Request Type */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Inquiry / Request Type
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as any)}
                className="w-full text-xs rounded-xl bg-background border border-input p-2.5 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Current Rate (RWF)
                  </label>
                  <input
                    type="number"
                    value={currentRate}
                    disabled
                    className="w-full text-xs rounded-xl bg-muted border border-border p-2.5 font-mono font-bold text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Proposed Rate (RWF)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 6000"
                    value={requestedRate}
                    onChange={(e) => setRequestedRate(e.target.value)}
                    className="w-full text-xs rounded-xl bg-background border border-input p-2.5 font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            {/* Justification Textarea */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Proposal Details & Justification <span className="text-destructive">*</span>
              </label>
              <textarea
                placeholder="Explain the rationale (e.g. new Olympic pool added, increased operational overhead, expansion to new branch)..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="pf-textarea-sm w-full text-xs rounded-xl bg-background border border-input p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Manager WhatsApp / Phone
                </label>
                <input
                  type="text"
                  placeholder="+250 788 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs rounded-xl bg-background border border-input p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Notification Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs rounded-xl bg-background border border-input p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-accent" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Inquiry'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
