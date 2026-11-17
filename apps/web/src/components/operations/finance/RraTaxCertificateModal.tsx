"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Building2,
  Receipt,
  FileCheck2,
  Sparkles
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatRwf } from "@/lib/invoice-pdf";

interface RraTaxCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
  invoiceNumber?: string;
}

export function RraTaxCertificateModal({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
}: RraTaxCertificateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certData, setCertData] = useState<any | null>(null);
  const [copiedSeal, setCopiedSeal] = useState(false);

  // Modern Web Guidance: Native <dialog> lifecycle synchronization
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

  // Fetch certificate from live backend
  useEffect(() => {
    if (isOpen && invoiceId) {
      setLoading(true);
      setError(null);
      apiFetch<any>(`/api/billing/invoices/${invoiceId}/tax-certificate`)
        .then((res) => {
          if (res?.certificate) {
            setCertData(res.certificate);
          } else {
            setError(res?.error || "Could not generate certificate");
          }
        })
        .catch((err) => {
          console.warn("[RraTaxCertificateModal] Error:", err.message);
          setError(err.message || "Failed to retrieve RRA Tax-Shield Certificate");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, invoiceId]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onClose();
  };

  const handleCopySeal = () => {
    if (certData?.cryptographic_seal) {
      navigator.clipboard.writeText(certData.cryptographic_seal);
      setCopiedSeal(true);
      setTimeout(() => setCopiedSeal(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      className="pf-native-dialog pf-dialog-lg p-0 bg-transparent text-[#0B1F33]"
      aria-labelledby="rra-cert-title"
    >
      <div className="relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 id="rra-cert-title" className="text-sm font-bold text-[#0B1F33] flex items-center gap-1.5">
                <span>RRA Article 24 CIT Tax-Shield Certificate</span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  30% CIT Deduction
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Official certified deduction document for corporate tax compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !certData}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
              <p className="text-xs">Generating cryptographically sealed RRA tax certificate...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2 text-rose-800">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <h3 className="font-bold text-sm">Failed to Load Tax Certificate</h3>
              <p className="text-xs text-rose-600 max-w-sm mx-auto">{error}</p>
            </div>
          ) : certData ? (
            <div className="space-y-4">
              {/* Certificate Border Frame */}
              <div className="p-6 rounded-2xl border-2 border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 space-y-5 relative">
                {/* Watermark Crest */}
                <div className="absolute right-6 top-6 opacity-5 pointer-events-none">
                  <ShieldCheck className="w-36 h-36 text-purple-900" />
                </div>

                {/* Formal Title Block */}
                <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-700 font-mono">
                      REPUBLIC OF RWANDA • RWANDA REVENUE AUTHORITY (RRA)
                    </span>
                    <h3 className="text-base font-extrabold text-[#0B1F33] tracking-tight mt-0.5">
                      Certificate of Qualifying Corporate Wellness Spend
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Statutory Tax Shield under Rwanda Law Nº 027/2022 of 20/10/2022 Establishing Taxes on Income (Article 24)
                    </p>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Certificate Ref</span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {certData.certificate_number}
                    </span>
                  </div>
                </div>

                {/* Organization & Period Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Certified Corporate Client
                    </span>
                    <div className="font-bold text-slate-900 text-sm">
                      {certData.organization_name}
                    </div>
                    <div className="font-mono text-slate-500 text-[11px]">
                      TIN: {certData.organization_tin || "TIN-Pending"}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Tax Period &amp; Verification
                    </span>
                    <div className="font-semibold text-slate-900">
                      {certData.period_start} → {certData.period_end}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C]" />
                      <span>{certData.total_verified_visits} Verified Telemetry Visits</span>
                    </div>
                  </div>
                </div>

                {/* Tax Shield Calculation Table */}
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span>Gross Invoice Total (EBM Verified):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatRwf(certData.gross_spend_rwf)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Input VAT (18% Statutory Deduction):</span>
                    <span className="font-mono text-indigo-700">
                      -{formatRwf(certData.vat_deduction_rwf)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-700 pt-1.5 border-t border-purple-200/60 font-semibold">
                    <span>Net Qualifying Wellness Spend:</span>
                    <span className="font-mono text-slate-900">
                      {formatRwf(certData.net_qualifying_wellness_spend_rwf)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-extrabold text-purple-900 pt-2 border-t border-purple-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      30% CIT Tax Deduction Benefit:
                    </span>
                    <span className="font-mono text-base text-purple-700">
                      {formatRwf(certData.cit_deduction_benefit_rwf)}
                    </span>
                  </div>
                </div>

                {/* Statutory Statement */}
                <div className="p-3 rounded-xl bg-slate-100/70 text-[11px] text-slate-600 italic leading-relaxed">
                  &quot;{certData.rra_compliance_statement}&quot;
                </div>

                {/* Cryptographic Seal & Public Verification Link */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      HMAC-SHA256 Cryptographic Seal
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySeal}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedSeal ? (
                        <>
                          <Check className="w-3 h-3 text-[#28D17C]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Seal</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-slate-300 break-all bg-slate-950 p-2 rounded-lg border border-slate-800">
                    {certData.cryptographic_seal}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">Public Verification Rail:</span>
                    <Link
                      href={`/verify/tax-cert/${certData.cryptographic_seal}`}
                      target="_blank"
                      className="text-[11px] font-bold text-[#28D17C] hover:underline flex items-center gap-1"
                    >
                      <span>Verify Publicly</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-mono">
                  Issued on: {certData.issued_at ? new Date(certData.issued_at).toLocaleDateString() : "Active"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-[#0B1F33] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
