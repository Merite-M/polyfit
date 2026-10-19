"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Sparkles, 
  Building2, 
  Dumbbell, 
  ArrowRight
} from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";

interface VisitorIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VisitorIntentModal({ isOpen, onClose }: VisitorIntentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

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

  // Fallback light-dismiss for older browsers without native closedby="any"
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdrop = (e: MouseEvent) => {
      if ("closedBy" in HTMLDialogElement.prototype) return;
      if (e.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener("click", handleBackdrop);
    return () => dialog.removeEventListener("click", handleBackdrop);
  }, [onClose]);

  const handleSelectFlow = (route: string) => {
    onClose();
    router.push(route);
  };

  return (
    <dialog
      ref={dialogRef}
      id="visitor-intent-dialog"
      closedby="any"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="visitor-intent-title"
      className="pf-native-dialog max-w-lg w-[94vw] max-h-[92dvh] my-auto mx-auto p-0 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden flex flex-col"
    >
      <div className="relative p-4 sm:p-6 overflow-y-auto max-h-[92dvh] flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <PolyFitLogo theme="auto" iconSize={24} />
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Welcome to PolyFit
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Title & Prompt */}
        <div className="text-center my-2.5 sm:my-3 space-y-1">
          <h2 id="visitor-intent-title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Which best describes you?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Choose your journey to access personalized wellness passes, employer proposals, or provider tools.
          </p>
        </div>

        {/* 3 Actor Option Cards */}
        <div className="space-y-2 sm:space-y-2.5 my-2 sm:my-2.5">
          {/* 1. Employee / Beneficiary */}
          <button
            type="button"
            onClick={() => handleSelectFlow("/join")}
            className="group w-full p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-left transition-all duration-150 flex items-center gap-3.5 cursor-pointer shadow-2xs hover:shadow-sm"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  I want to activate my PolyFit benefit
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  Employees
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Check employer sponsorship, verify by work email or Staff ID, and unlock your mobile pass.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
          </button>

          {/* 2. Employer / Company */}
          <button
            type="button"
            onClick={() => handleSelectFlow("/corporate/register")}
            className="group w-full p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all duration-150 flex items-center gap-3.5 cursor-pointer shadow-2xs hover:shadow-sm"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  I am an Employer / HR Leader
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Companies
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Subsidized corporate plans, employee benefit allocation & single monthly RRA EBM invoices.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
          </button>

          {/* 3. Wellness Provider / Facility */}
          <button
            type="button"
            onClick={() => handleSelectFlow("/partner/register")}
            className="group w-full p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-left transition-all duration-150 flex items-center gap-3.5 cursor-pointer shadow-2xs hover:shadow-sm"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  I operate a Wellness Facility
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Partners
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Receive corporate client traffic, Net-15 automated settlements & free check-in tools.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
          </button>
        </div>
      </div>
    </dialog>
  );
}
