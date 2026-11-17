"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building2,
  Receipt
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatRwf } from "@/lib/invoice-pdf";

interface MomoDisburseModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: any | null;
  onSuccess: (updatedSettlement: any) => void;
}

export function MomoDisburseModal({
  isOpen,
  onClose,
  settlement,
  onSuccess,
}: MomoDisburseModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const prov = settlement?.providers || {};
  const bankDetails = prov.bank_details || {};
  const initialPhone = bankDetails.momo_phone || bankDetails.phone || "";

  const [phone, setPhone] = useState(initialPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disburseResult, setDisburseResult] = useState<any | null>(null);

  useEffect(() => {
    if (settlement) {
      const p = settlement?.providers?.bank_details?.momo_phone || settlement?.providers?.bank_details?.phone || "";
      setPhone(p);
      setDisburseResult(null);
      setError(null);
    }
  }, [settlement]);

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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onClose();
  };

  const totalAmt = Number(settlement?.total_amount) || 0;

  const handleDisburse = async () => {
    if (!settlement?.id) return;
    try {
      setIsSubmitting(true);
      setError(null);

      const res = await apiFetch<any>(`/api/settlements/${settlement.id}/disburse/momo`, {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: phone.trim(),
          force: true,
        }),
      });

      if (res?.success) {
        setDisburseResult(res);
        onSuccess(res.settlement || { ...settlement, status: "paid", payment_reference: res.payment_reference });
      } else {
        setError(res?.error || "Failed to disburse mobile money");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to disburse mobile money remittance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      className="pf-native-dialog pf-dialog-md p-0 bg-transparent text-[#0B1F33]"
      aria-labelledby="momo-disburse-title"
    >
      <div className="relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 id="momo-disburse-title" className="text-sm font-bold text-[#0B1F33]">
                MTN MoMo &amp; Airtel Money Instant Disburse
              </h2>
              <p className="text-[11px] text-slate-500">
                Direct mobile money treasury disbursement rail
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {disburseResult ? (
            <div className="p-5 rounded-2xl bg-[#E9FAF2] border border-[#B7F1D2] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#28D17C] text-[#0B1F33] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1F33]">
                  Remittance Disbursed Successfully!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Transferred <strong className="text-[#008A4B]">{formatRwf(totalAmt)}</strong> to {prov?.name}.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#B7F1D2] text-left space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Tx Reference:</span>
                  <span className="font-bold text-[#0B1F33]">{disburseResult.payment_reference}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Telco Rail:</span>
                  <span className="font-bold text-amber-700 uppercase">{disburseResult.rail || "MTN MoMo"}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Phone Number:</span>
                  <span className="font-bold text-slate-800">{disburseResult.phone_number || phone}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#0B1F33] text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Remittance Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Wellness Provider:</span>
                  <span className="font-bold text-[#0B1F33]">{prov?.name || "Partner Facility"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Statement ID:</span>
                  <span className="font-mono text-slate-700">SETTLE-{settlement?.id?.slice(0, 8)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Verified Visits:</span>
                  <span className="font-bold font-mono text-[#0B1F33]">{settlement?.total_visits || 0}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Net Remittance Amount:</span>
                  <span className="text-base font-extrabold font-mono text-[#008A4B]">
                    {formatRwf(totalAmt)}
                  </span>
                </div>
              </div>

              {/* Rwandan Mobile Money Phone Input */}
              <div className="space-y-1.5">
                <label htmlFor="momo-phone-input" className="block text-xs font-semibold text-slate-700">
                  Recipient Rwandan Mobile Money Phone (MTN / Airtel):
                </label>
                <div className="relative">
                  <input
                    id="momo-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0788123456 or +250788123456"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:border-[#28D17C] focus:ring-1 focus:ring-[#28D17C] outline-none transition-all"
                  />
                  <div className="absolute right-3 top-2.5">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      RWF Rail
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Supports MTN Rwanda (078/079) and Airtel Rwanda (072/073). Real-time disbursement confirmation.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDisburse}
                  disabled={isSubmitting || !phone.trim()}
                  className="px-5 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Disbursing via MoMo...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Disburse {formatRwf(totalAmt)}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
