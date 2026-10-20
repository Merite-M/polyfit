"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Receipt,
  ArrowRight,
  X
} from "lucide-react";
import type { CorporateOrganization } from "@/contexts/CorporateContext";

interface CorporateWelcomeModalProps {
  open: boolean;
  onClose: () => void;
  organization: CorporateOrganization;
  inviteUrl: string;
}

export function CorporateWelcomeModal({
  open,
  onClose,
  organization,
  inviteUrl
}: CorporateWelcomeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onClose={onClose}
      className="backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm bg-transparent p-4 max-w-2xl w-full m-auto rounded-3xl outline-none border-none text-[#0B1F33] z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-foreground relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close welcome modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Celebration */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Corporate Program Live &bull; Rwanda Network</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1F33] dark:text-white">
            Welcome to PolyFit, {organization.name}!
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Your corporate wellness benefits account is ready. Follow these 3 launch actions to activate access for your workforce:
          </p>
        </div>

        {/* 3 Step Action Grid */}
        <div className="space-y-3">
          {/* Action 1: Instant Team Join Link */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-[#0B1F33] dark:text-white">
                  Share Workforce Self-Enrollment Link
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                @{organization.domain} Only
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
              Staff can self-activate passes in seconds using their official company email address.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Action 2: Pre-enroll via Census CSV */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#0B1F33] dark:text-white">
                  Pre-Enroll Team via Employee Census CSV
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload an RFC 4180 CSV with staff names and badge IDs to assign benefit tiers in bulk.
                </p>
              </div>
            </div>

            <Link
              href="/corporate/employees"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-foreground whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Manage Roster</span>
            </Link>
          </div>

          {/* Action 3: Review EBM Tax Invoice */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#0B1F33] dark:text-white">
                  Rwanda EBM v2.1 Tax Invoice
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  18% VAT itemized &bull; 100% corporate tax deductible &bull; Settle via MTN/Airtel MoMo or Bank Wire.
                </p>
              </div>
            </div>

            <Link
              href="/corporate/billing"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-foreground whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>View Billing</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span>Enter Corporate Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </dialog>
  );
}
