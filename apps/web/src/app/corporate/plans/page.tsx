"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  Plus,
  Table,
  LayoutGrid,
  Calculator,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Users,
  Shield,
  Crown,
  Building2,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { PlanCard, BenefitPlan } from "@/components/corporate/PlanCard";
import { PlanComparisonMatrix } from "@/components/corporate/PlanComparisonMatrix";
import { BudgetForecasterCard } from "@/components/corporate/BudgetForecasterCard";
import { PlanBuilderModal } from "@/components/corporate/PlanBuilderModal";
import { AssignPlanModal } from "@/components/corporate/AssignPlanModal";

import { TECHCORP_CANONICAL_DATA } from "@/lib/constants";

export default function PlansPage() {
  const { organizationId, isDemoMode } = useAuth();
  const activeOrgId = organizationId || TECHCORP_CANONICAL_DATA.organization.id;

  const [plans, setPlans] = useState<BenefitPlan[]>(
    TECHCORP_CANONICAL_DATA.plans as unknown as BenefitPlan[]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft">("all");
  const [activeView, setActiveView] = useState<"grid" | "matrix" | "forecast">("grid");

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BenefitPlan | null>(null);
  const [assigningPlan, setAssigningPlan] = useState<BenefitPlan | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Modern Web Guidance: View Transitions for intra-page filter & view changes
  const handleTabChange = (tab: "all" | "active" | "draft") => {
    if (tab === activeTab) return;
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as any).startViewTransition(() => {
        setActiveTab(tab);
      });
    } else {
      setActiveTab(tab);
    }
  };

  const handleViewChange = (view: "grid" | "matrix" | "forecast") => {
    if (view === activeView) return;
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as any).startViewTransition(() => {
        setActiveView(view);
      });
    } else {
      setActiveView(view);
    }
  };

  // Fetch benefit plans from backend
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ benefits: BenefitPlan[] }>(
        `/api/organizations/${activeOrgId}/benefits`
      );
      if (res && Array.isArray(res.benefits) && res.benefits.length > 0) {
        setPlans(res.benefits);
      } else {
        setPlans(TECHCORP_CANONICAL_DATA.plans as unknown as BenefitPlan[]);
      }
    } catch (err) {
      console.warn("[PlansPage] Backend unreachable or demo mode, using canonical plans:", err);
      setPlans(TECHCORP_CANONICAL_DATA.plans as unknown as BenefitPlan[]);
    } finally {
      setIsLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

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
    if (editingPlan) {
      // Update
      try {
        await apiFetch(`/api/organizations/${activeOrgId}/benefits/${editingPlan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(planData)
        });
        showNotification(`Updated benefit plan: "${planData.name || editingPlan.name}"`);
      } catch (e) {
        console.warn("[PlansPage] Offline update:", e);
        showNotification(`Updated benefit plan: "${planData.name || editingPlan.name}" (local demo)`);
      }
      setPlans((prev) =>
        prev.map((p) => (p.id === editingPlan.id ? { ...p, ...planData } : p))
      );
    } else {
      // Create
      const tempId = `plan-custom-${Date.now()}`;
      try {
        const res = await apiFetch<{ benefit: BenefitPlan }>(
          `/api/organizations/${activeOrgId}/benefits`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(planData)
          }
        );
        if (res && res.benefit) {
          setPlans((prev) => [res.benefit, ...prev]);
        } else {
          setPlans((prev) => [{ ...planData, id: tempId, enrolled_count: 0 } as BenefitPlan, ...prev]);
        }
        showNotification(`Created new benefit plan: "${planData.name}"`);
      } catch (e) {
        console.warn("[PlansPage] Offline creation:", e);
        setPlans((prev) => [{ ...planData, id: tempId, enrolled_count: 0 } as BenefitPlan, ...prev]);
        showNotification(`Created new benefit plan: "${planData.name}" (local demo)`);
      }
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
      await apiFetch(`/api/organizations/${activeOrgId}/benefits/${assigningPlan.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showNotification(
        `Assigned ${payload.departments.join(", ")} to ${assigningPlan.name} (${
          payload.effectiveTiming === "next_billing_cycle" ? "Scheduled for next cycle" : "Effective immediately"
        })`
      );
    } catch (e) {
      console.warn("[PlansPage] Offline assign:", e);
      showNotification(
        `Assigned ${payload.departments.join(", ")} to ${assigningPlan.name} (${
          payload.effectiveTiming === "next_billing_cycle" ? "Scheduled for next cycle" : "Effective immediately"
        })`
      );
    }

    // Refresh plan stats
    fetchPlans();
  };

  const formatRwf = (amt: number) => {
    return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amt) + " RWF";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#0B1F33] text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#28D17C]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#8491A3] mb-4">
        <Link href="/corporate" className="hover:text-[#0B1F33] flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Overview</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1F33] font-semibold">Benefit Plan Builder</span>
      </div>

      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#0B1F33]">Corporate Benefit Plans</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E0F9F5] text-[#007A68] border border-[#B7F1D2]">
              {plans.length} Configured Tiers
            </span>
          </div>
          <p className="text-xs text-[#526173] mt-1.5 max-w-2xl leading-relaxed">
            Design multi-tier corporate wellness benefits, configure monthly visit allowances, set co-pay cost sharing rules, and model liability forecasting for your workforce.
          </p>
        </div>

        {/* Top Action CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPlans()}
            className="p-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#526173] hover:text-[#0B1F33] hover:bg-[#F8FAFC] transition-colors"
            title="Refresh Plans"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-[#28D17C]")} />
          </button>

          <button
            onClick={() => {
              setEditingPlan(null);
              setIsBuilderOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#28D17C] text-[#0B1F33] font-bold text-xs hover:bg-[#22BC6E] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[#8491A3] uppercase tracking-wider">
              Enrolled Workforce
            </div>
            <div className="text-2xl font-black text-[#0B1F33] mt-1 font-mono">
              {totalEnrolled} <span className="text-xs font-normal text-[#526173]">employees</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F1F4F8] text-[#0B1F33] flex items-center justify-center">
            <Users className="w-5 h-5 text-[#007A68]" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[#8491A3] uppercase tracking-wider">
              Est. Monthly Subsidy
            </div>
            <div className="text-2xl font-black text-[#0B1F33] mt-1 font-mono">
              {formatRwf(totalMonthlyLiability)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E0F9F5] text-[#007A68] flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[#8491A3] uppercase tracking-wider">
              Rwanda 30% Tax Shield
            </div>
            <div className="text-2xl font-black text-[#008A4B] mt-1 font-mono">
              {formatRwf(Math.round(totalMonthlyLiability * 0.30))}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E9FAF2] text-[#008A4B] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#28D17C]" />
          </div>
        </div>
      </div>

      {/* View Switcher & Tabs (View Transitions enabled) */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
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
            <Calculator className="w-3.5 h-3.5 text-secondary" />
            <span>Budget Forecaster</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-6">
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
