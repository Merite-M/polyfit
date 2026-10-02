"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BenefitPlan } from "./PlanCard";

interface AssignPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BenefitPlan | null;
  onAssignSubmit: (payload: {
    departments: string[];
    employeeIds: string[];
    effectiveTiming: "immediate" | "next_billing_cycle";
  }) => Promise<void>;
  availableDepartments?: { name: string; count: number }[];
}

const DEFAULT_DEPARTMENTS = [
  { name: "Engineering", count: 42 },
  { name: "Marketing", count: 18 },
  { name: "Sales", count: 26 },
  { name: "Finance", count: 14 },
  { name: "HR", count: 8 },
  { name: "Operations", count: 32 }
];

export const AssignPlanModal: React.FC<AssignPlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  onAssignSubmit,
  availableDepartments = DEFAULT_DEPARTMENTS
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [effectiveTiming, setEffectiveTiming] = useState<"immediate" | "next_billing_cycle">("immediate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize native <dialog> element
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

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onClose();
  };

  const toggleDept = (deptName: string) => {
    setSelectedDepts((prev) =>
      prev.includes(deptName) ? prev.filter((d) => d !== deptName) : [...prev, deptName]
    );
  };

  const selectAllDepts = () => {
    if (selectedDepts.length === availableDepartments.length) {
      setSelectedDepts([]);
    } else {
      setSelectedDepts(availableDepartments.map((d) => d.name));
    }
  };

  const totalSelectedHeadcount = availableDepartments
    .filter((d) => selectedDepts.includes(d.name))
    .reduce((acc, d) => acc + d.count, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDepts.length === 0) {
      setError("Please select at least one department to assign to this plan.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAssignSubmit({
        departments: selectedDepts,
        employeeIds: [],
        effectiveTiming
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign employees";
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

  if (!plan && !isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      closedby="any"
      className="pf-native-dialog p-0 bg-transparent text-foreground"
      aria-labelledby="assign-plan-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-modal overflow-hidden flex flex-col text-card-foreground">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/60 flex items-center justify-between">
          <div>
            <h2 id="assign-plan-title" className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-secondary" />
              <span>Assign Roster to {plan?.name || "Corporate Plan"}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bulk assign corporate departments to the {plan?.tier || "Standard"} tier.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Plan Summary Pill */}
          {plan && (
            <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                <div>
                  <div className="text-xs font-bold text-foreground">{plan.name}</div>
                  <div className="text-[11px] text-secondary-foreground/80">
                    {plan.max_monthly_visits} visits/mo • {plan.co_pay_percentage}% co-pay
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-card border border-secondary/30 text-secondary">
                {plan.tier || "Standard"}
              </span>
            </div>
          )}

          {/* Department Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Select Company Departments</span>
              </label>
              <button
                type="button"
                onClick={selectAllDepts}
                className="text-[11px] text-secondary hover:underline font-semibold cursor-pointer"
              >
                {selectedDepts.length === availableDepartments.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {availableDepartments.map((dept) => {
                const checked = selectedDepts.includes(dept.name);
                return (
                  <div
                    key={dept.name}
                    onClick={() => toggleDept(dept.name)}
                    className={cn(
                      "p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                      checked
                        ? "bg-accent-subtle/60 border-accent text-accent-foreground font-semibold"
                        : "bg-card border-border hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-4 h-4 rounded flex items-center justify-center text-xs transition-colors",
                          checked ? "bg-accent text-accent-foreground" : "border border-border"
                        )}
                      >
                        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-accent-foreground" />}
                      </div>
                      <span className="text-xs font-semibold">{dept.name}</span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-muted-foreground">
                      {dept.count} staff
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Effective Timing */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              When should this assignment take effect?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setEffectiveTiming("immediate")}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-colors text-left",
                  effectiveTiming === "immediate"
                    ? "bg-secondary/15 border-secondary"
                    : "bg-card border-border"
                )}
              >
                <div className="text-xs font-bold text-foreground">Apply Immediately</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Update active passes today
                </div>
              </div>

              <div
                onClick={() => setEffectiveTiming("next_billing_cycle")}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-colors text-left",
                  effectiveTiming === "next_billing_cycle"
                    ? "bg-secondary/15 border-secondary"
                    : "bg-card border-border"
                )}
              >
                <div className="text-xs font-bold text-foreground">Next Billing Cycle</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Effective {nextBillingCycleDate}
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Summary Bar */}
          <div className="p-3.5 rounded-xl bg-muted border border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Staff to Migrate:</span>
            <span className="font-bold text-foreground font-mono text-sm">
              {totalSelectedHeadcount} employees
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-input text-muted-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedDepts.length === 0}
              className="px-5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Assigning..." : `Assign ${totalSelectedHeadcount} Employees`}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
