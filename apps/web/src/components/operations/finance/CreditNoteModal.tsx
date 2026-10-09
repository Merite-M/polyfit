"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileMinus2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatRwf } from "@/lib/invoice-pdf";

interface CreditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any | null;
  onAdjustmentApplied?: (updatedInvoice: any) => void;
}

export function CreditNoteModal({
  isOpen,
  onClose,
  invoice,
  onAdjustmentApplied,
}: CreditNoteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("courtesy_discount");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setAmount("");
      setNotes("");
      setError(null);
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current && !isSubmitting) {
      onClose();
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice?.id) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive adjustment amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<any>(`/api/operations/finance/invoices/${invoice.id}/adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: numAmount,
          reason,
          notes: notes.trim(),
        }),
      });

      if (onAdjustmentApplied) {
        onAdjustmentApplied(data.invoice);
      }
      onClose();
    } catch (err: any) {
      console.error("[CreditNoteModal] Adjustment error:", err);
      setError(err?.message || "Failed to apply invoice adjustment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        if (!isSubmitting) onClose();
      }}
      closedby="any"
      aria-labelledby="credit-note-modal-title"
      className="backdrop:bg-black/60 backdrop:backdrop-blur-xs bg-transparent p-0 m-auto border-none outline-none overflow-hidden max-w-md w-full rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileMinus2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="credit-note-modal-title" className="text-sm font-bold text-white">
                Issue Credit Note / Adjustment
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {invoice?.invoice_number || invoice?.id?.substring(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500">Current Total (incl. 18% VAT)</span>
            <span className="font-mono font-bold text-slate-900">
              {invoice?.total_amount ? formatRwf(Number(invoice.total_amount)) : "0 RWF"}
            </span>
          </div>

          <form onSubmit={handleApplyAdjustment} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("credit")}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                    type === "credit"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Credit Note (Deduct)
                </button>
                <button
                  type="button"
                  onClick={() => setType("debit")}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                    type === "debit"
                      ? "bg-amber-50 border-amber-500 text-amber-800 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Debit Adjustment (Add)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Adjustment Amount (Pre-Tax RWF)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400">
                  RWF
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Statutory 18% VAT will be automatically adjusted based on this amount.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Reason Code
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="courtesy_discount">Commercial Goodwill / Courtesy Discount</option>
                <option value="overbilling_correction">Overbilling / Invoicing Correction</option>
                <option value="downtime_refund">Facility Offline / Downtime Compensation</option>
                <option value="contract_renegotiation">Retroactive Contract Rate Amendment</option>
                <option value="other">Other Administrative Adjustment</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Audit Notes / Justification
              </label>
              <textarea
                rows={2}
                placeholder="Provide internal notes for fiscal audit trail..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 active:scale-[0.99] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <span>Apply Adjustment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}
