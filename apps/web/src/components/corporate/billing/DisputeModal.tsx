"use client";

import React, { useState } from "react";
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
  const [selectedReason, setSelectedReason] = useState(DISPUTE_CATEGORIES[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setErrorMsg("Please select a dispute reason category.");
      return;
    }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#F1F4F8] flex items-center justify-between bg-[#F7F9FC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#D97706] flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1F33]">
                Dispute Invoice Statement
              </h3>
              <p className="text-xs text-[#526173]">
                Statement: <span className="font-semibold text-[#0B1F33]">{invoice.invoice_number || invoice.id}</span> • {formatRwf(invoice.total_amount)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8491A3] hover:text-[#0B1F33] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#E9FAF2] text-[#16A34A] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#0B1F33]">Dispute Logged Successfully</h4>
            <p className="text-xs text-[#526173] mt-1 max-w-sm mx-auto leading-relaxed">
              Your inquiry has been registered with PolyFit Finance Ops. The statement has been marked as Disputed and auto-debit has been held pending investigation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0B1F33] mb-1.5">
                Dispute Reason Category <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-[#CBD5E1] bg-white p-2.5 text-[#0B1F33] focus:border-[#006D3C] focus:ring-1 focus:ring-[#006D3C] outline-none"
              >
                {DISPUTE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F33] mb-1.5">
                Discrepancy Details & Employee Reference
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify employee names, check-in dates, or facility locations involved in this dispute..."
                className="w-full text-xs rounded-xl border border-[#CBD5E1] bg-white p-2.5 text-[#0B1F33] placeholder:text-[#8491A3] focus:border-[#006D3C] focus:ring-1 focus:ring-[#006D3C] outline-none resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#F7F9FC] border border-[#F1F4F8] text-[11px] text-[#526173] leading-relaxed">
              <span className="font-semibold text-[#0B1F33]">Dispute Protocol:</span> Marking an invoice as disputed halts overdue penalties and alerts PolyFit reconciliation specialists within 4 business hours.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#F1F4F8]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#526173] hover:bg-[#F7F9FC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit Formal Dispute"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
