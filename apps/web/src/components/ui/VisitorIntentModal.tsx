"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  X, 
  Sparkles, 
  Building2, 
  Dumbbell, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2,
  LogIn
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
      className="pf-native-dialog max-w-xl w-full p-0 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden"
    >
      <div className="relative p-6 sm:p-8">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <PolyFitLogo theme="dark" iconSize={28} />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Welcome to PolyFit
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Prompt */}
        <div className="text-center my-6 space-y-1.5">
          <h2 id="visitor-intent-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Which best describes you?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Choose your journey to access personalized corporate wellness passes, employer proposals, or provider partnership tools.
          </p>
        </div>

        {/* 3 Actor Option Cards */}
        <div className="space-y-3.5 my-6">
          {/* 1. Employee / Beneficiary */}
          <button
            type="button"
            onClick={() => handleSelectFlow("/join")}
            className="group w-full p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-left transition-all duration-200 flex items-start gap-4 cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  I want to activate my PolyFit benefit
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  Employees
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Check if your employer sponsors PolyFit, verify by company email or Staff ID, and unlock your mobile pass for 50+ venues.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0 mt-3 hidden sm:block" />
          </button>

          {/* 2. Employer / Company */}
          <button
            type="button"
            onClick={() => handleSelectFlow("/corporate/register")}
            className="group w-full p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all duration-200 flex items-start gap-4 cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  I am an Employer / HR Leader
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Companies
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Offer subsidized wellness across Rwanda. Calculate team quotes, select benefit tiers, and receive single monthly RRA EBM invoices.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 mt-3 hidden sm:block" />
          </button>

          {/* 3. Wellness Provider / Gym / Studio */}
          <button
            type="button"
            onClick={() => handleSelectFlow("/partner/register")}
            className="group w-full p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-left transition-all duration-200 flex items-start gap-4 cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  I operate a Gym or Wellness Facility
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Partners
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Join our verified wellness network. Receive corporate client traffic, Net-15 automated settlements (5,000 RWF/check-in), and free front-desk check-in tools.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0 mt-3 hidden sm:block" />
          </button>
        </div>

        {/* Existing User Login Links */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <LogIn className="w-4 h-4 text-slate-400" />
            <span>Already have an account?</span>
          </div>
          <div className="flex items-center gap-3 font-semibold">
            <Link 
              href="/corporate" 
              onClick={onClose}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Corporate Portal
            </Link>
            <span>&bull;</span>
            <Link 
              href="/partner" 
              onClick={onClose}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Partner Portal
            </Link>
            <span>&bull;</span>
            <Link 
              href="/operations" 
              onClick={onClose}
              className="text-slate-700 dark:text-slate-300 hover:underline"
            >
              Operations
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}
