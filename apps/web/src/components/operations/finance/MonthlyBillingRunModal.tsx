"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileCheck2,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Receipt,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatRwf } from "@/lib/invoice-pdf";

interface MonthlyBillingRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCompleted?: () => void;
}

export function MonthlyBillingRunModal({
  isOpen,
  onClose,
  onRunCompleted,
}: MonthlyBillingRunModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Default to previous month
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const defaultStart = prevMonthDate.toISOString().split("T")[0];
  const defaultEnd = prevMonthEnd.toISOString().split("T")[0];

  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setResult(null);
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

  const handleExecuteBillingRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<any>("/api/operations/finance/billing-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
        }),
      });

      setResult(data);
      if (onRunCompleted) {
        onRunCompleted();
      }
    } catch (err: any) {
      console.error("[MonthlyBillingRunModal] Billing run error:", err);
      setError(err?.message || "Failed to execute monthly billing run");
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
      aria-labelledby="billing-run-modal-title"
      className="backdrop:bg-black/60 backdrop:backdrop-blur-xs bg-transparent p-0 m-auto border-none outline-none overflow-hidden max-w-lg w-full rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#0B1F33] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="billing-run-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Monthly B2B Billing Run</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#28D17C] text-[#0B1F33] font-bold">
                  AUTORUN
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Compile verified check-ins into RRA-compliant draft invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Billing Run Finished Successfully</span>
                </div>
                <p className="text-xs text-emerald-700">
                  {result.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium text-[11px]">Draft Invoices Created</div>
                  <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">
                    {result.generated ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium text-[11px]">Skipped (Already Exists/0 Visits)</div>
                  <div className="font-mono text-xl font-bold text-slate-600 mt-0.5">
                    {result.skipped ?? 0}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1F33] text-white text-xs space-y-2">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#28D17C]" />
                  <span>Next Operational Actions</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>Review drafts in the Corporate Invoices view.</li>
                  <li>Click any invoice to download RRA-compliant PDF with 18% VAT.</li>
                  <li>Invoices are generated in draft status ready for ops review before dispatch.</li>
                </ul>
              </div>
            </div>
          ) : (
            <form onSubmit={handleExecuteBillingRun} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-semibold text-[#0B1F33] flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Automated B2B Contract Aggregation</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Scans all verified check-ins within the selected calendar window across all contracted wellness facilities. Computes per-visit rates, employee tier copays, and statutory 18% Rwanda VAT.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Period Start
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#28D17C] focus:border-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Period End
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#28D17C] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Statutory Tax Engine</span>
                  <span className="font-semibold text-slate-800">18% Rwanda VAT (RRA)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Terms</span>
                  <span className="font-semibold text-slate-800">Net 30 Days</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Target Accounts</span>
                  <span className="font-semibold text-slate-800">All Active Corporate Employers</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
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
                  className="px-5 py-2.5 rounded-lg bg-[#28D17C] text-[#0B1F33] font-bold text-xs hover:bg-[#22BC6E] active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Compiling Invoices...</span>
                    </>
                  ) : (
                    <>
                      <span>Execute Billing Run</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        {result && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-[#0B1F33] text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
