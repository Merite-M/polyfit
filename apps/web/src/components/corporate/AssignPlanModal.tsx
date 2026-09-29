"use client";

import React, { useState } from "react";
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
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [effectiveTiming, setEffectiveTiming] = useState<"immediate" | "next_billing_cycle">("immediate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !plan) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0B1F33] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#007A68]" />
              <span>Assign Roster to {plan.name}</span>
            </h2>
            <p className="text-xs text-[#526173] mt-0.5">
              Bulk assign corporate departments to the {plan.tier || "Standard"} tier.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] hover:bg-[#F1F4F8] text-[#526173] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Plan Summary Pill */}
          <div className="p-3.5 rounded-xl bg-[#E0F9F5]/40 border border-[#B7F1D2] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#28D17C]" />
              <div>
                <div className="text-xs font-bold text-[#0B1F33]">{plan.name}</div>
                <div className="text-[11px] text-[#007A68]">
                  {plan.max_monthly_visits} visits/mo • {plan.co_pay_percentage}% co-pay
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white border border-[#B7F1D2] text-[#007A68]">
              {plan.tier || "Standard"}
            </span>
          </div>

          {/* Department Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#0B1F33] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#8491A3]" />
                <span>Select Company Departments</span>
              </label>
              <button
                type="button"
                onClick={selectAllDepts}
                className="text-[11px] text-[#007A68] hover:underline font-semibold"
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
                        ? "bg-[#E9FAF2] border-[#28D17C] text-[#008A4B]"
                        : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-4 h-4 rounded flex items-center justify-center text-xs transition-colors",
                          checked ? "bg-[#28D17C] text-white" : "border border-[#CBD5E1]"
                        )}
                      >
                        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-xs font-semibold">{dept.name}</span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#8491A3]">
                      {dept.count} staff
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Effective Timing */}
          <div>
            <label className="block text-xs font-semibold text-[#0B1F33] mb-2">
              When should this assignment take effect?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setEffectiveTiming("immediate")}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-colors text-left",
                  effectiveTiming === "immediate"
                    ? "bg-[#E0F9F5]/40 border-[#00D2B4]"
                    : "bg-white border-[#E2E8F0]"
                )}
              >
                <div className="text-xs font-bold text-[#0B1F33]">Apply Immediately</div>
                <div className="text-[11px] text-[#526173] mt-0.5">
                  Update active passes today
                </div>
              </div>

              <div
                onClick={() => setEffectiveTiming("next_billing_cycle")}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-colors text-left",
                  effectiveTiming === "next_billing_cycle"
                    ? "bg-[#E0F9F5]/40 border-[#00D2B4]"
                    : "bg-white border-[#E2E8F0]"
                )}
              >
                <div className="text-xs font-bold text-[#0B1F33]">Next Billing Cycle</div>
                <div className="text-[11px] text-[#526173] mt-0.5">
                  Effective {nextBillingCycleDate}
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Summary Bar */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#526173]">Total Staff to Migrate:</span>
            <span className="font-bold text-[#0B1F33] font-mono text-sm">
              {totalSelectedHeadcount} employees
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#526173] text-xs font-semibold hover:bg-[#F8FAFC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedDepts.length === 0}
              className="px-5 py-2 rounded-xl bg-[#28D17C] text-[#0B1F33] text-xs font-bold hover:bg-[#22BC6E] transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Assigning..." : `Assign ${totalSelectedHeadcount} Employees`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
