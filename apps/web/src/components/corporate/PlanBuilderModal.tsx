"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Layers,
  Crown,
  Shield,
  CheckCircle2,
  Calendar,
  Percent,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BenefitPlan } from "./PlanCard";

interface PlanBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: Partial<BenefitPlan>) => Promise<void>;
  initialPlan?: BenefitPlan | null;
}

const CATEGORY_OPTIONS = [
  { id: "gym", label: "Fitness Centers & Strength", desc: "Access to strength equipment, cardio suites, and weights" },
  { id: "pool", label: "Aquatic & Lap Pools", desc: "Access to Olympic and hotel lap pools" },
  { id: "studio", label: "Yoga, Pilates & Group Studios", desc: "Group classes, HIIT, barre, and spin" },
  { id: "clinic", label: "Physiotherapy & Recovery Clinics", desc: "Injury recovery, chiropractic, sports massage" },
  { id: "wellness_center", label: "Holistic Wellness Centers", desc: "Thermal baths, sauna, steam, and cryotherapy" }
];

export const PlanBuilderModal: React.FC<PlanBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPlan
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState("");
  const [tier, setTier] = useState<string>("standard");
  const [status, setStatus] = useState<string>("active");
  const [description, setDescription] = useState("");
  const [maxVisits, setMaxVisits] = useState(8);
  const [copayPct, setCopayPct] = useState(15);
  const [budgetCap, setBudgetCap] = useState<number | "">("");
  const [isFamilyEligible, setIsFamilyEligible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "gym",
    "pool",
    "studio"
  ]);
  const [effectiveTiming, setEffectiveTiming] = useState<"immediate" | "next_billing_cycle">("immediate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with initialPlan on open
  useEffect(() => {
    if (initialPlan) {
      setName(initialPlan.name || "");
      setTier(initialPlan.tier || "standard");
      setStatus(initialPlan.status || "active");
      setDescription(initialPlan.description || "");
      setMaxVisits(initialPlan.max_monthly_visits || 8);
      setCopayPct(Number(initialPlan.co_pay_percentage || 0));
      setBudgetCap(initialPlan.budget_cap_per_employee !== null && initialPlan.budget_cap_per_employee !== undefined ? Number(initialPlan.budget_cap_per_employee) : "");
      setIsFamilyEligible(Boolean(initialPlan.is_family_eligible));
      setSelectedCategories(initialPlan.allowed_provider_categories || ["gym", "pool"]);
      setEffectiveTiming(initialPlan.effective_timing === "next_billing_cycle" ? "next_billing_cycle" : "immediate");
    } else {
      setName("");
      setTier("standard");
      setStatus("active");
      setDescription("");
      setMaxVisits(8);
      setCopayPct(15);
      setBudgetCap("");
      setIsFamilyEligible(false);
      setSelectedCategories(["gym", "pool", "studio"]);
      setEffectiveTiming("immediate");
    }
    setError(null);
  }, [initialPlan, isOpen]);

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

  // Modern Web Guidance fallback for light-dismiss
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if ("closedBy" in HTMLDialogElement.prototype) return;
    if (e.target !== dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isInside =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInside) {
      onClose();
    }
  };

  // Synchronize native Escape key cancel event
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onClose();
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a plan name.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Please select at least one covered provider category.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        tier,
        status,
        description: description.trim() || undefined,
        max_monthly_visits: Number(maxVisits),
        co_pay_percentage: Number(copayPct),
        budget_cap_per_employee: budgetCap === "" ? null : Number(budgetCap),
        is_family_eligible: isFamilyEligible,
        allowed_provider_categories: selectedCategories,
        effective_timing: effectiveTiming
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save benefit plan";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextBillingCycleDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1
  ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      closedby="any"
      className="pf-native-dialog pf-dialog-lg p-0 bg-transparent text-foreground"
      aria-labelledby="plan-builder-title"
    >
      <div className="relative w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-modal flex flex-col text-card-foreground">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-card/95 backdrop-blur-xs flex items-center justify-between">
          <div>
            <h2 id="plan-builder-title" className="text-lg font-bold text-foreground">
              {initialPlan ? "Edit Corporate Benefit Plan" : "Create Corporate Benefit Plan"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure subsidy tiers, visit allowances, and co-pay rules for your employees.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-muted hover:bg-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identity & Tier */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              1. Plan Identity & Tier Classification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Wellness Tier"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input text-xs text-foreground bg-background focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors pf-form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Tier Level
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input text-xs text-foreground bg-background focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
                >
                  <option value="executive">Executive Tier (High-touch & Premium)</option>
                  <option value="premium">Premium Tier</option>
                  <option value="standard">Standard Tier (Default Workforce)</option>
                  <option value="basic">Basic Tier (Essential)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Plan Lifecycle Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("active")}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer",
                      status === "active"
                        ? "bg-accent-subtle border-accent/40 text-accent-foreground font-bold"
                        : "bg-card border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Active (Publish now)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("draft")}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer",
                      status === "draft"
                        ? "bg-warning/15 border-warning/30 text-warning font-bold"
                        : "bg-card border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Draft (Internal review)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Brief Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100% employer paid across all network venues"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input text-xs text-foreground bg-background focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Quota & Co-Pay Rules */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              2. Visit Quotas & Co-Pay Cost-Sharing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Max Monthly Visits *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={maxVisits}
                    onChange={(e) => setMaxVisits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input text-xs text-foreground bg-background font-bold focus:border-ring outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">visits/mo</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Employee Co-Pay (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={copayPct}
                    onChange={(e) => setCopayPct(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input text-xs text-foreground bg-background font-bold focus:border-ring outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">% co-pay</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {copayPct === 0 ? "0% = 100% employer funded" : `Employee pays ${copayPct}% per visit`}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Monthly Budget Cap
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    placeholder="Unlimited"
                    value={budgetCap}
                    onChange={(e) => setBudgetCap(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input text-xs text-foreground bg-background font-mono focus:border-ring outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">RWF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Provider Category Access */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                3. Allowed Network Provider Categories
              </h3>
              <span className="text-xs text-muted-foreground">
                {selectedCategories.length} categories enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const checked = selectedCategories.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5",
                      checked
                        ? "bg-accent-subtle/50 border-accent shadow-xs"
                        : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-colors",
                        checked ? "bg-accent text-accent-foreground" : "border border-border"
                      )}
                    >
                      {checked && <CheckCircle2 className="w-3 h-3 text-accent-foreground" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{cat.label}</div>
                      <div className="text-[11px] text-muted-foreground leading-snug">{cat.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Family Pass & Effective Timing */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              4. Family Policy & Activation Schedule
            </h3>

            {/* Family Pass Toggle */}
            <div className="p-3.5 rounded-xl bg-muted border border-border flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-foreground">Family & Dependent Coverage</div>
                <div className="text-[11px] text-muted-foreground">
                  Allow employees to register a spouse or dependent under this plan quota.
                </div>
              </div>
              <input
                type="checkbox"
                checked={isFamilyEligible}
                onChange={(e) => setIsFamilyEligible(e.target.checked)}
                className="w-4 h-4 accent-accent cursor-pointer"
              />
            </div>

            {/* Effective Timing */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Effective Timing for Plan Updates
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setEffectiveTiming("immediate")}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5",
                    effectiveTiming === "immediate"
                      ? "bg-secondary/15 border-secondary"
                      : "bg-card border-border"
                  )}
                >
                  <input
                    type="radio"
                    name="timing"
                    checked={effectiveTiming === "immediate"}
                    onChange={() => setEffectiveTiming("immediate")}
                    className="mt-0.5 accent-secondary"
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground">Apply Immediately</div>
                    <div className="text-[11px] text-muted-foreground">
                      Take effect right now for all assigned employees.
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setEffectiveTiming("next_billing_cycle")}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5",
                    effectiveTiming === "next_billing_cycle"
                      ? "bg-secondary/15 border-secondary"
                      : "bg-card border-border"
                  )}
                >
                  <input
                    type="radio"
                    name="timing"
                    checked={effectiveTiming === "next_billing_cycle"}
                    onChange={() => setEffectiveTiming("next_billing_cycle")}
                    className="mt-0.5 accent-secondary"
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground">Next Billing Cycle</div>
                    <div className="text-[11px] text-muted-foreground">
                      Take effect on <strong>{nextBillingCycleDate}</strong> for payroll stability.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-input text-muted-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Saving Plan...</span>
              ) : (
                <span>{initialPlan ? "Update Plan" : "Publish Benefit Plan"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
