"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileSpreadsheet,
  Download,
  Smartphone,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface DisbursementExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisbursementExportModal({
  isOpen,
  onClose,
}: DisbursementExportModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [rail, setRail] = useState<"momo" | "bank">("momo");
  const [status, setStatus] = useState<string>("approved");
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStats, setExportStats] = useState<{
    filename: string;
    count: number;
    total_amount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setExportStats(null);
      setError(null);
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current && !isExporting) {
      onClose();
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    setError(null);
    setExportStats(null);

    try {
      const queryParams = new URLSearchParams({
        type: rail,
        status: status,
        format: "json",
      });
      if (periodStart) queryParams.append("period_start", periodStart);
      if (periodEnd) queryParams.append("period_end", periodEnd);

      const meta = await apiFetch<any>(`/api/operations/finance/disbursements?${queryParams.toString()}`);

      if (!meta || meta.count === 0) {
        setError(`No ${status} settlements found matching the criteria for ${rail.toUpperCase()}.`);
        setIsExporting(false);
        return;
      }

      setExportStats({
        filename: meta.filename,
        count: meta.count,
        total_amount: meta.total_amount,
      });

      const blob = new Blob([meta.content], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", meta.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("[DisbursementExportModal] Export failed:", err);
      setError(err?.message || "Failed to generate disbursement CSV export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        if (isExporting) {
          e.preventDefault();
        } else {
          onClose();
        }
      }}
      className="m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-xs focus:outline-none"
    >
      <div className="flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Disbursement Batch Export
              </h2>
              <p className="text-xs text-slate-500">
                Formatted settlement payout files for banking & telecom rails
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {exportStats && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950">
                  Successfully exported {exportStats.count} settlement{exportStats.count !== 1 ? "s" : ""}
                </p>
                <p className="mt-0.5 text-emerald-800">
                  Total payout: <span className="font-mono font-bold text-slate-900">{exportStats.total_amount.toLocaleString()} RWF</span>
                </p>
                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  File: {exportStats.filename}
                </p>
              </div>
            </div>
          )}

          {/* Rail Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Disbursement Rail
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRail("momo")}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                  rail === "momo"
                    ? "border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20"
                    : "border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Smartphone className={`h-4 w-4 ${rail === "momo" ? "text-amber-600" : "text-slate-400"}`} />
                  <span className="text-xs font-bold text-slate-900">MTN MoMo Bulk</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-snug">
                  Rwanda MoMo corporate bulk CSV for instant mobile wallet settlement
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRail("bank")}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                  rail === "bank"
                    ? "border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className={`h-4 w-4 ${rail === "bank" ? "text-blue-600" : "text-slate-400"}`} />
                  <span className="text-xs font-bold text-slate-900">Bank Batch EFT</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-snug">
                  Commercial bank EFT/RTGS format (BK, Equity, I&M, Cogebanque)
                </span>
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Settlement Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "approved", label: "Approved Only", desc: "Ready to pay" },
                { id: "pending", label: "Draft / Pending", desc: "Awaiting approval" },
                { id: "all", label: "All Unpaid", desc: "Draft & Approved" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatus(item.id)}
                  className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-medium transition ${
                    status === item.id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/20 font-semibold"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter (Optional) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Optional Period Filter</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 shadow-2xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating CSV...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download {rail === "momo" ? "MoMo" : "Bank EFT"} Batch CSV
              </>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
