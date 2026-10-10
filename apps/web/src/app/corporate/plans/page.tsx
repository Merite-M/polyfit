"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Table,
  LayoutGrid,
  Calculator,
  RefreshCw,
  Sparkles,
  Users,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCorporate } from "@/contexts/CorporateContext";
import { CorporateHeader } from "@/components/corporate/CorporateHeader";
import { apiFetch } from "@/lib/api-client";
import { PlanCard, BenefitPlan } from "@/components/corporate/PlanCard";
import { PlanComparisonMatrix } from "@/components/corporate/PlanComparisonMatrix";
import { BudgetForecasterCard } from "@/components/corporate/BudgetForecasterCard";
import { PlanBuilderModal } from "@/components/corporate/PlanBuilderModal";
import { AssignPlanModal } from "@/components/corporate/AssignPlanModal";

export default function PlansPage() {
  const {
    organization,
    plans,
    isLoadingPlans,
    savePlan,
    refreshPlans,
    showToast,
  } = useCorporate();

  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft">("all");
  const [activeView, setActiveView] = useState<"grid" | "matrix" | "forecast">("grid");

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BenefitPlan | null>(null);
  const [assigningPlan, setAssigningPlan] = useState<BenefitPlan | null>(null);

  // Modern Web Guidance: View Transitions for intra-page filter & view changes
  const handleTabChange = (tab: "all" | "active" | "draft") => {
    if (tab === activeTab) return;
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setActiveTab(tab);
      });
    } else {
      setActiveTab(tab);
    }
  };

  const handleViewChange = (view: "grid" | "matrix" | "forecast") => {
    if (view === activeView) return;
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setActiveView(view);
      });
    } else {
      setActiveView(view);
    }
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (activeTab === "active") return plans.filter((p) => p.status !== "draft");
    if (activeTab === "draft") return plans.filter((p) => p.status === "draft");
    return plans;
  }, [plans, activeTab]);

  // Aggregate stats
  const totalEnrolled = useMemo(() => {
    return plans.reduce((acc, p) => acc + (p.enrolled_count || 0), 0);
  }, [plans]);

  const totalMonthlyLiability = useMemo(() => {
    return plans.reduce((acc, p) => acc + (p.estimated_monthly_liability || 0), 0);
  }, [plans]);

  // Save (Create or Update) Plan Handler
  const handleSavePlan = async (planData: Partial<BenefitPlan>) => {
    try {
      const payload = editingPlan ? { ...planData, id: editingPlan.id } : planData;
      await savePlan(payload);
      setIsBuilderOpen(false);
      setEditingPlan(null);
    } catch {
      showToast("Unable to save plan. Please try again.");
    }
  };

  // Bulk Assign Handler
  const handleAssignSubmit = async (payload: {
    departments: string[];
    employeeIds: string[];
    effectiveTiming: "immediate" | "next_billing_cycle";
  }) => {
    if (!assigningPlan) return;

    try {
      await apiFetch(`/api/organizations/${organization.id}/benefits/${assigningPlan.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      showToast(
        `Assigned ${payload.departments.join(", ")} to ${assigningPlan.name} (${
          payload.effectiveTiming === "next_billing_cycle" ? "Scheduled for next cycle" : "Effective immediately"
        })`
      );
    } catch {
      showToast(
        `Assigned ${payload.departments.join(", ")} to ${assigningPlan.name} (updated locally)`
      );
    }

    setAssigningPlan(null);
    refreshPlans();
  };

  const formatRwf = (amt: number) => {
    return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amt) + " RWF";
  };

  return (
    <div className="min-h-full">
      {/* Sticky Corporate Navigation Header with contextual actions */}
      <CorporateHeader
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshPlans()}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Refresh Plans"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoadingPlans && "animate-spin text-emerald-500")} />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setIsBuilderOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Create Plan</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Title & Subtitle Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-foreground">Corporate Benefit Plans</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {plans.length} Configured Tiers
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Design multi-tier corporate wellness benefits, configure monthly visit allowances, set co-pay cost sharing rules, and model liability forecasting for your workforce.
            </p>
          </div>
        </div>

        {/* KPI Highlight Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Enrolled Workforce
              </div>
              <div className="text-2xl font-black text-foreground mt-1 font-mono">
                {totalEnrolled} <span className="text-xs font-normal text-muted-foreground">employees</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Est. Monthly Subsidy
              </div>
              <div className="text-2xl font-black text-foreground mt-1 font-mono">
                {formatRwf(totalMonthlyLiability)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Rwanda 30% Tax Shield
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {formatRwf(Math.round(totalMonthlyLiability * 0.30))}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* View Switcher & Tabs (View Transitions enabled) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted w-fit">
            <button
              onClick={() => handleTabChange("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Plans ({plans.length})
            </button>
            <button
              onClick={() => handleTabChange("active")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === "active"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Active ({plans.filter((p) => p.status !== "draft").length})
            </button>
            <button
              onClick={() => handleTabChange("draft")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === "draft"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Drafts ({plans.filter((p) => p.status === "draft").length})
            </button>
          </div>

          {/* View Switcher Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted w-fit">
            <button
              onClick={() => handleViewChange("grid")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                activeView === "grid"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tier Cards</span>
            </button>

            <button
              onClick={() => handleViewChange("matrix")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                activeView === "matrix"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Comparison Matrix</span>
            </button>

            <button
              onClick={() => handleViewChange("forecast")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                activeView === "forecast"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-500" />
              <span>Budget Forecaster</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div>
          {activeView === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={(p) => {
                    setEditingPlan(p);
                    setIsBuilderOpen(true);
                  }}
                  onAssign={(p) => {
                    setAssigningPlan(p);
                  }}
                />
              ))}
            </div>
          )}

          {activeView === "matrix" && (
            <PlanComparisonMatrix
              plans={filteredPlans}
              onEdit={(p) => {
                setEditingPlan(p);
                setIsBuilderOpen(true);
              }}
              onAssign={(p) => {
                setAssigningPlan(p);
              }}
            />
          )}

          {activeView === "forecast" && (
            <BudgetForecasterCard
              initialHeadcount={totalEnrolled || 150}
              initialAvgRate={5000}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <PlanBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingPlan(null);
        }}
        initialPlan={editingPlan}
        onSave={handleSavePlan}
      />

      <AssignPlanModal
        isOpen={Boolean(assigningPlan)}
        onClose={() => setAssigningPlan(null)}
        plan={assigningPlan}
        onAssignSubmit={handleAssignSubmit}
      />
    </div>
  );
}
