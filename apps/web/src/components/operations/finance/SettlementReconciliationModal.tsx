"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Coins,
  Calendar,
  Network,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  Lock
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface SettlementReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCompleted?: () => void;
}

export function SettlementReconciliationModal({
  isOpen,
  onClose,
  onRunCompleted,
}: SettlementReconciliationModalProps) {
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

  const handleExecuteReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<any>("/api/operations/finance/settlement-run", {
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
      console.error("[SettlementReconciliationModal] Reconciliation error:", err);
      setError(err?.message || "Failed to execute provider settlement reconciliation");
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
      aria-labelledby="settlement-run-modal-title"
      className="backdrop:bg-black/60 backdrop:backdrop-blur-xs bg-transparent p-0 m-auto border-none outline-none overflow-hidden max-w-lg w-full rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#0B1F33] to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 id="settlement-run-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Provider Settlement Reconciliation</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-400 text-[#0B1F33] font-bold">
                  CLEARINGHOUSE
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Audit verified visits and calculate partner facility payouts
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
                  <span>Reconciliation Run Completed</span>
                </div>
                <p className="text-xs text-emerald-700">
                  {result.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium text-[11px]">Settlements Generated</div>
                  <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">
                    {result.generated ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium text-[11px]">Skipped (No Traffic/0 Visits)</div>
                  <div className="font-mono text-xl font-bold text-slate-600 mt-0.5">
                    {result.skipped ?? 0}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1F33] text-white text-xs space-y-2">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#28D17C]" />
                  <span>Escrow & Disbursement Status</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>Any check-ins with active open disputes are held in escrow.</li>
                  <li>Settlements are set to 'Pending Approval'.</li>
                  <li>1-click approve and export formatted files for MTN MoMo Bulk or Bank EFT.</li>
                </ul>
              </div>
            </div>
          ) : (
            <form onSubmit={handleExecuteReconciliation} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Dispute Escrow Protection (Zero Cash Leakage)</span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Any visit involved in an active open dispute in the Live Visit Monitor (PF-120) is automatically held from the settlement batch. Once resolved by an ops lead, the adjustment will be released in the next cycle.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Reconciliation Period Start
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Reconciliation Period End
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Target Providers</span>
                  <span className="font-semibold text-slate-800">All Contracted Active Facilities</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Disbursement Rails</span>
                  <span className="font-semibold text-slate-800">MTN MoMo Bulk / Commercial Bank EFT</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Disbursement Date</span>
                  <span className="font-semibold text-slate-800">15th of Calendar Month</span>
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
                  className="px-5 py-2.5 rounded-lg bg-[#0B1F33] text-white font-bold text-xs hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                      <span>Reconciling Providers...</span>
                    </>
                  ) : (
                    <>
                      <span>Execute Reconciliation</span>
                      <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
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
