"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  Crown,
  Search,
  Filter,
  UserCheck,
  User,
  Check,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BenefitPlan } from "./PlanCard";
import type { CorporateEmployee } from "./EmployeeDetailDrawer";

export interface AssignPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BenefitPlan | null;
  onAssignSubmit: (payload: {
    departments: string[];
    employeeIds: string[];
    effectiveTiming: "immediate" | "next_billing_cycle";
  }) => Promise<void>;
  availableDepartments?: { name: string; count: number }[];
  availableEmployees?: CorporateEmployee[];
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
  availableDepartments = DEFAULT_DEPARTMENTS,
  availableEmployees = []
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  // Assignment scope mode: 'people' (individual or multi-select individuals) vs 'departments' (bulk department)
  const [assignMode, setAssignMode] = useState<"people" | "departments">("people");

  // Selection states
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  // Filtering states for individuals
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [selectedTierFilter, setSelectedTierFilter] = useState("all");

  const [effectiveTiming, setEffectiveTiming] = useState<"immediate" | "next_billing_cycle">("immediate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Reset local state when opened with a new plan
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedEmployeeIds([]);
      setSelectedDepts([]);
      setSearchQuery("");
      setSelectedDeptFilter("all");
      setSelectedTierFilter("all");
    }
  }, [isOpen, plan?.id]);

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

  // Distinct departments present in employee roster
  const uniqueEmployeeDepartments = useMemo(() => {
    const set = new Set<string>();
    availableEmployees.forEach((emp) => {
      if (emp.department) set.add(emp.department);
    });
    return Array.from(set).sort();
  }, [availableEmployees]);

  // Distinct tiers present in employee roster
  const uniqueEmployeeTiers = useMemo(() => {
    const set = new Set<string>();
    availableEmployees.forEach((emp) => {
      if (emp.tier) set.add(emp.tier.toLowerCase());
    });
    return Array.from(set).sort();
  }, [availableEmployees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return availableEmployees.filter((emp) => {
      if (selectedDeptFilter !== "all" && emp.department !== selectedDeptFilter) {
        return false;
      }
      if (selectedTierFilter !== "all" && (emp.tier || "").toLowerCase() !== selectedTierFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = emp.full_name?.toLowerCase().includes(q);
        const matchesEmail = emp.email?.toLowerCase().includes(q);
        const matchesDept = emp.department?.toLowerCase().includes(q);
        const matchesId = emp.employee_id_external?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept && !matchesId) return false;
      }
      return true;
    });
  }, [availableEmployees, selectedDeptFilter, selectedTierFilter, searchQuery]);

  // Individual selection toggles
  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFilteredEmployees = () => {
    const visibleIds = filteredEmployees.map((e) => e.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedEmployeeIds.includes(id));

    if (allVisibleSelected) {
      setSelectedEmployeeIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedEmployeeIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const clearEmployeeSelection = () => {
    setSelectedEmployeeIds([]);
  };

  // Department selection toggles
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

  // Compute selected stats
  const totalSelectedDeptHeadcount = availableDepartments
    .filter((d) => selectedDepts.includes(d.name))
    .reduce((acc, d) => acc + d.count, 0);

  // Distinct departments among selected individuals
  const selectedIndividualsDeptCount = useMemo(() => {
    const depts = new Set<string>();
    availableEmployees
      .filter((e) => selectedEmployeeIds.includes(e.id))
      .forEach((e) => {
        if (e.department) depts.add(e.department);
      });
    return depts.size;
  }, [availableEmployees, selectedEmployeeIds]);

  // Compute effective total to assign based on mode
  const effectiveTotalAssigned = useMemo(() => {
    if (assignMode === "people") {
      return selectedEmployeeIds.length;
    }
    if (assignMode === "departments") {
      return totalSelectedDeptHeadcount;
    }
    return selectedEmployeeIds.length + totalSelectedDeptHeadcount;
  }, [assignMode, selectedEmployeeIds.length, totalSelectedDeptHeadcount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasPeople = selectedEmployeeIds.length > 0;
    const hasDepts = selectedDepts.length > 0;

    if (!hasPeople && !hasDepts) {
      setError(
        assignMode === "people"
          ? "Please select at least one employee to assign to this plan."
          : "Please select at least one department to assign to this plan."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAssignSubmit({
        departments: assignMode === "departments" ? selectedDepts : (hasDepts ? selectedDepts : []),
        employeeIds: assignMode === "people" ? selectedEmployeeIds : (hasPeople ? selectedEmployeeIds : []),
        effectiveTiming
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign employees to benefit plan";
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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      closedby="any"
      className="pf-native-dialog p-0 bg-transparent text-foreground z-[9999] outline-none"
      aria-labelledby="assign-plan-title"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] rounded-2xl bg-card border border-border shadow-modal overflow-hidden flex flex-col text-card-foreground animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/60 flex items-center justify-between shrink-0">
          <div>
            <h2 id="assign-plan-title" className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-secondary" />
              <span>Assign Beneficiaries to {plan?.name || "Corporate Plan"}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assign single individuals, custom groups across departments, or entire teams to the{" "}
              <span className="font-semibold text-foreground">{plan?.tier || "Standard"}</span> tier.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
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
                    {plan.max_monthly_visits} visits/mo &bull; {plan.co_pay_percentage}% employee co-pay
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-card border border-secondary/30 text-secondary">
                {plan.tier || "Standard"} Tier
              </span>
            </div>
          )}

          {/* Assignment Scope Tabs Switcher */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Choose Assignment Mode:
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted border border-border">
              <button
                type="button"
                onClick={() => setAssignMode("people")}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                  assignMode === "people"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserCheck className="w-3.5 h-3.5 text-secondary" />
                <span>
                  Selected People {selectedEmployeeIds.length > 0 && `(${selectedEmployeeIds.length})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAssignMode("departments")}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                  assignMode === "departments"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 className="w-3.5 h-3.5 text-secondary" />
                <span>
                  Whole Departments {selectedDepts.length > 0 && `(${selectedDepts.length})`}
                </span>
              </button>
            </div>
          </div>

          {/* MODE A: Individual Employees / Custom Group Selection */}
          {assignMode === "people" && (
            <div className="space-y-3">
              {/* Filter & Search Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, department, or staff ID..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-secondary transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Department Filter Pill */}
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-[11px] text-muted-foreground focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    {uniqueEmployeeDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>

                  {/* Tier Filter Pill */}
                  <select
                    value={selectedTierFilter}
                    onChange={(e) => setSelectedTierFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-[11px] text-muted-foreground focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="all">All Current Tiers</option>
                    {uniqueEmployeeTiers.map((t) => (
                      <option key={t} value={t}>
                        {t.toUpperCase()}
                      </option>
                    ))}
                  </select>

                  {(searchQuery || selectedDeptFilter !== "all" || selectedTierFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedDeptFilter("all");
                        setSelectedTierFilter("all");
                      }}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              {/* Selection Summary & Quick Actions */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {selectedEmployeeIds.length === 0
                      ? "0 selected"
                      : selectedEmployeeIds.length === 1
                      ? "1 employee selected"
                      : `${selectedEmployeeIds.length} employees selected (${selectedIndividualsDeptCount} dept${
                          selectedIndividualsDeptCount === 1 ? "" : "s"
                        })`}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    &bull; Showing {filteredEmployees.length} matching
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllFilteredEmployees}
                    className="text-[11px] text-secondary hover:underline font-semibold cursor-pointer"
                  >
                    {filteredEmployees.length > 0 &&
                    filteredEmployees.every((e) => selectedEmployeeIds.includes(e.id))
                      ? "Deselect Filtered"
                      : "Select All Filtered"}
                  </button>
                  {selectedEmployeeIds.length > 0 && (
                    <>
                      <span className="text-muted-foreground/40">&bull;</span>
                      <button
                        type="button"
                        onClick={clearEmployeeSelection}
                        className="text-[11px] text-destructive hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable Employee Roster */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/30 border border-border rounded-xl p-2 bg-background/50">
                {filteredEmployees.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                    <User className="w-6 h-6 mx-auto text-muted-foreground/40" />
                    <p className="font-semibold">No employees found</p>
                    <p className="text-[11px]">Try adjusting your search query or department filter.</p>
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isChecked = selectedEmployeeIds.includes(emp.id);
                    const initials = emp.full_name
                      ? emp.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "EM";

                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        className={cn(
                          "pt-1.5 first:pt-0 p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer group",
                          isChecked
                            ? "bg-secondary/15 border border-secondary/40 text-foreground"
                            : "hover:bg-muted/70 text-foreground border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Checkbox */}
                          <div
                            className={cn(
                              "w-4 h-4 rounded flex items-center justify-center shrink-0 text-xs transition-colors",
                              isChecked
                                ? "bg-accent text-accent-foreground"
                                : "border border-border group-hover:border-foreground/50"
                            )}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          {/* Avatar Initials */}
                          <div className="w-7 h-7 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-bold text-[10px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>

                          {/* Name & Details */}
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                              <span>{emp.full_name}</span>
                              {emp.employee_id_external && (
                                <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                  ({emp.employee_id_external})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">{emp.email}</div>
                          </div>
                        </div>

                        {/* Badges: Department & Current Tier */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted border border-border text-muted-foreground">
                            {emp.department || "General"}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border",
                              emp.tier?.toLowerCase() === "executive"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : emp.tier?.toLowerCase() === "premium"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {emp.tier || "standard"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* MODE B: Entire Departments Bulk Selection */}
          {assignMode === "departments" && (
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
                          ? "bg-secondary/15 border-secondary text-foreground font-semibold"
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
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
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
          )}

          {/* Effective Timing */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              When should this tier assignment take effect?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setEffectiveTiming("immediate")}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-colors text-left",
                  effectiveTiming === "immediate"
                    ? "bg-secondary/15 border-secondary"
                    : "bg-card border-border hover:bg-muted/50"
                )}
              >
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Apply Immediately</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Update active mobile passes today
                </div>
              </div>

              <div
                onClick={() => setEffectiveTiming("next_billing_cycle")}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-colors text-left",
                  effectiveTiming === "next_billing_cycle"
                    ? "bg-secondary/15 border-secondary"
                    : "bg-card border-border hover:bg-muted/50"
                )}
              >
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-secondary" />
                  <span>Next Billing Cycle</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Effective {nextBillingCycleDate}
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Summary Bar */}
          <div className="p-3.5 rounded-xl bg-muted border border-border flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px]">Assignment Summary:</span>
              <span className="font-semibold text-foreground">
                {assignMode === "people"
                  ? selectedEmployeeIds.length === 1
                    ? "1 single employee selected"
                    : `${selectedEmployeeIds.length} employees selected across ${selectedIndividualsDeptCount} department${
                        selectedIndividualsDeptCount === 1 ? "" : "s"
                      }`
                  : `${selectedDepts.length} department${selectedDepts.length === 1 ? "" : "s"} selected`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block text-[11px]">Total Headcount:</span>
              <span className="font-bold text-foreground font-mono text-sm text-secondary">
                {effectiveTotalAssigned} {effectiveTotalAssigned === 1 ? "employee" : "employees"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-input text-muted-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || effectiveTotalAssigned === 0}
              className="px-5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                "Assigning..."
              ) : assignMode === "people" && selectedEmployeeIds.length === 1 ? (
                "Assign 1 Employee"
              ) : (
                `Assign ${effectiveTotalAssigned} ${effectiveTotalAssigned === 1 ? "Employee" : "Employees"}`
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>,
    document.body
  );
};
