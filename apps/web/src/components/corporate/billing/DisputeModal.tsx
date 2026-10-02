"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, AlertCircle, ShieldAlert, Send, CheckCircle2 } from "lucide-react";
import { formatRwf } from "@/lib/invoice-pdf";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoice_number?: string;
    total_amount: number;
    billing_period_start: string;
    billing_period_end: string;
  } | null;
  onSubmitDispute: (invoiceId: string, reason: string, notes: string) => Promise<void>;
}

const DISPUTE_CATEGORIES = [
  "Former employee included after formal departure / termination",
  "Duplicate check-in or visit recorded for beneficiary",
  "Contracted provider rate discrepancy",
  "Facility temporary closure or service disruption during visit",
  "Incorrect department billing allocation",
  "Other administrative discrepancy",
];

export function DisputeModal({
  isOpen,
  onClose,
  invoice,
  onSubmitDispute,
}: DisputeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedReason, setSelectedReason] = useState(DISPUTE_CATEGORIES[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (!selectedReason) {
      setErrorMsg("Please select a dispute reason category.");
      return;
    }
    if (!invoice) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSubmitDispute(invoice.id, selectedReason, notes);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit invoice dispute";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!invoice && !isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      closedby="any"
      className="pf-native-dialog p-0 bg-transparent text-foreground"
      aria-labelledby="dispute-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-modal overflow-hidden text-card-foreground">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="dispute-modal-title" className="text-base font-bold text-foreground">
                Dispute Invoice Statement
              </h3>
              <p className="text-xs text-muted-foreground">
                Statement: <span className="font-semibold text-foreground">{invoice?.invoice_number || invoice?.id}</span> • {formatRwf(invoice?.total_amount || 0)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-accent-subtle text-accent-foreground flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">Dispute Logged Successfully</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              Your inquiry has been registered with PolyFit Finance Ops. The statement has been marked as Disputed and auto-debit has been held pending investigation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Dispute Reason Category <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
              >
                {DISPUTE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Discrepancy Details & Employee Reference
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify employee names, check-in dates, or facility locations involved in this dispute..."
                className="pf-textarea-sm w-full text-xs rounded-xl border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/70 border border-border text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Dispute Protocol:</span> Marking an invoice as disputed halts overdue penalties and alerts PolyFit reconciliation specialists within 4 business hours.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-input text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-warning hover:bg-warning/90 text-warning-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit Formal Dispute"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
