"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Shield,
  Crown,
  Layers,
  Lock,
  Percent,
  TrendingDown,
  Sparkles,
  AlertCircle,
  Clock,
  DollarSign,
  Building2,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BenefitPlan } from "./PlanCard";

interface CoPayAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BenefitPlan | null;
  onSave: (payload: {
    id: string;
    co_pay_percentage: number;
    effective_timing: "immediate" | "next_billing_cycle";
  }) => Promise<void>;
}

const CATEGORY_LABELS: Record<string, string> = {
  gym: "Fitness & Gyms",
  pool: "Swimming Pools",
  studio: "Yoga & Pilates",
  clinic: "Physio & Health",
  wellness_center: "Wellness Centers"
};

export const CoPayAdjustmentModal: React.FC<CoPayAdjustmentModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSave
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [copayPct, setCopayPct] = useState(15);
  const [effectiveTiming, setEffectiveTiming] = useState<"immediate" | "next_billing_cycle">("immediate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with initialPlan on open
  useEffect(() => {
    if (plan) {
      setCopayPct(Number(plan.co_pay_percentage ?? 15));
      setEffectiveTiming(
        plan.effective_timing === "next_billing_cycle" ? "next_billing_cycle" : "immediate"
      );
    }
    setError(null);
  }, [plan, isOpen]);

  // Synchronize native <dialog> with isOpen state
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!plan) return null;

  const employerSubsidyPct = Math.max(0, 100 - copayPct);
  const enrolled = plan.enrolled_count || 0;
  const visits = plan.max_monthly_visits || 8;
  const avgVisitBenchmarkRwf = 5000;

  // Real-time liability calculations
  const employerCostPerVisit = Math.round(avgVisitBenchmarkRwf * (employerSubsidyPct / 100));
  const employeeCostPerVisit = Math.round(avgVisitBenchmarkRwf * (copayPct / 100));
  const estMonthlyEmployerLiability = Math.round(enrolled * visits * employerCostPerVisit);
  const taxShieldRwf = Math.round(estMonthlyEmployerLiability * 0.30);

  const formatRwf = (amt: number) => {
    return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amt) + " RWF";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: plan.id,
        co_pay_percentage: copayPct,
        effective_timing: effectiveTiming
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update co-pay ratio. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tier = (plan.tier || "standard").toLowerCase();
  const isExecutive = tier === "executive" || tier === "premium";

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      className="backdrop:bg-slate-950/70 backdrop:backdrop-blur-xs p-0 m-auto bg-transparent border-none max-w-xl w-full select-none"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Adjust Co-Pay & Cost Sharing
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure employee payroll deduction vs. corporate sponsorship for this contracted tier.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close co-pay modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Contracted Plan Summary (Read-Only) */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider",
                    isExecutive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/15 text-secondary-foreground border border-secondary/20"
                  )}
                >
                  {isExecutive ? <Crown className="w-3 h-3 text-amber-500" /> : <Shield className="w-3 h-3 text-accent" />}
                  {plan.tier || "Standard Tier"}
                </span>
                <span className="text-xs font-bold text-foreground">{plan.name}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span className="font-semibold text-foreground">{enrolled}</span>
                <span>enrolled</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">Monthly Visit Allowance</span>
                <span className="text-xs font-bold text-foreground mt-0.5 block">{visits} visits / member / month</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">Covered Categories</span>
                <span className="text-xs font-bold text-foreground mt-0.5 block truncate">
                  {(plan.allowed_provider_categories || []).map((c) => CATEGORY_LABELS[c] || c).join(", ")}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Network facility access rules, category caps, and visit allowances are governed by your PolyFit corporate master agreement. HR administrators may adjust the company subsidy ratio below.
              </p>
            </div>
          </div>

          {/* Interactive Co-Pay / Subsidy Split Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="copay-slider" className="text-xs font-bold text-foreground">
                Employer Subsidy vs. Employee Payroll Co-Pay
              </label>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-bold">
                  {employerSubsidyPct}% Company Subsidy
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  {copayPct}% Employee Co-Pay
                </span>
              </div>
            </div>

            {/* Range Slider */}
            <div className="space-y-2">
              <input
                id="copay-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={copayPct}
                onChange={(e) => setCopayPct(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0% Co-Pay (100% Sponsored)</span>
                <span>50% Equal Split</span>
                <span>100% Employee Paid</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: "100% Employer Funded", copay: 0 },
                { label: "85% Subsidy (15% Co-Pay)", copay: 15 },
                { label: "70% Subsidy (30% Co-Pay)", copay: 30 },
                { label: "50% Equal Co-Pay", copay: 50 },
              ].map((preset) => (
                <button
                  key={preset.copay}
                  type="button"
                  onClick={() => setCopayPct(preset.copay)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                    copayPct === preset.copay
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time Financial & Tax Impact */}
          <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>Financial Impact & Tax Shield Breakdown</span>
              <span className="text-[10px] font-normal text-muted-foreground">Benchmark: ~5,000 RWF / visit</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-[11px] text-muted-foreground block">Employer Share / Visit</span>
                <span className="text-base font-bold text-accent font-mono mt-0.5 block">
                  {formatRwf(employerCostPerVisit)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Billed monthly via consolidated invoice</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-[11px] text-muted-foreground block">Employee Payroll Co-Pay / Visit</span>
                <span className="text-base font-bold text-amber-700 dark:text-amber-400 font-mono mt-0.5 block">
                  {formatRwf(employeeCostPerVisit)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Deducted from salary slip via HR census</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Rwanda 30% Corporate Tax Shield</span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Qualifies as tax-deductible employee welfare expense under RRA guidelines.
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatRwf(taxShieldRwf)}
                </span>
                <span className="text-[10px] text-muted-foreground block">tax reduction / mo</span>
              </div>
            </div>
          </div>

          {/* Effective Timing */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              Policy Effective Timing
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEffectiveTiming("immediate")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                  effectiveTiming === "immediate"
                    ? "bg-primary/5 border-primary text-foreground"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Immediate</span>
                  {effectiveTiming === "immediate" && <span className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Updates active member pass rules and payroll deductibility immediately.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEffectiveTiming("next_billing_cycle")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                  effectiveTiming === "next_billing_cycle"
                    ? "bg-primary/5 border-primary text-foreground"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Next Billing Cycle</span>
                  {effectiveTiming === "next_billing_cycle" && <span className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Applies starting the 1st of next month, aligning with payroll cutoff.
                </p>
              </button>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <Percent className="w-3.5 h-3.5" />
                <span>Save Co-Pay Policy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};
