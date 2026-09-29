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

const FALLBACK_PLANS: BenefitPlan[] = [
  {
    id: "plan-exec-01",
    name: "TechCorp Executive Wellness Tier",
    tier: "executive",
    status: "active",
    max_monthly_visits: 16,
    co_pay_percentage: 0,
    allowed_provider_categories: ["gym", "pool", "studio", "clinic", "wellness_center"],
    budget_cap_per_employee: 120000,
    is_family_eligible: true,
    description: "Unrestricted access across all network venues including boutique studios and physio clinics. 100% employer subsidized.",
    enrolled_count: 24,
    departments: ["Executive", "Finance"],
    department_counts: { Executive: 8, Finance: 16 },
    estimated_monthly_liability: 1920000
  },
  {
    id: "plan-std-02",
    name: "TechCorp Standard Wellness Plan",
    tier: "standard",
    status: "active",
    max_monthly_visits: 8,
    co_pay_percentage: 15,
    allowed_provider_categories: ["gym", "pool", "studio"],
    budget_cap_per_employee: 60000,
    is_family_eligible: false,
    description: "Core corporate wellness benefit covering premium gyms, lap pools, and yoga studios with 15% co-pay.",
    enrolled_count: 98,
    departments: ["Engineering", "Marketing", "HR"],
    department_counts: { Engineering: 52, Marketing: 32, HR: 14 },
    estimated_monthly_liability: 3332000
  },
  {
    id: "plan-basic-03",
    name: "Essential Fitness & Pool Plan",
    tier: "basic",
    status: "active",
    max_monthly_visits: 4,
    co_pay_percentage: 40,
    allowed_provider_categories: ["gym", "pool"],
    budget_cap_per_employee: 30000,
    is_family_eligible: false,
    description: "Essential fitness benefit for shift and operations teams. Covers network gyms and public lap pools.",
    enrolled_count: 28,
    departments: ["Operations"],
    department_counts: { Operations: 28 },
    estimated_monthly_liability: 336000
  }
];

export default function PlansPage() {
  const { organizationId, isDemoMode } = useAuth();
  const activeOrgId = organizationId || "c79a9982-4477-4336-a24b-561419f6c43b";

  const [plans, setPlans] = useState<BenefitPlan[]>(FALLBACK_PLANS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft">("all");
  const [activeView, setActiveView] = useState<"grid" | "matrix" | "forecast">("grid");

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BenefitPlan | null>(null);
  const [assigningPlan, setAssigningPlan] = useState<BenefitPlan | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
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
        setPlans(FALLBACK_PLANS);
      }
    } catch (err) {
      console.warn("[PlansPage] Backend unreachable or demo mode, using fallback plans:", err);
      setPlans(FALLBACK_PLANS);
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

      {/* View Switcher & Tabs */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F1F4F8] w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === "all"
                ? "bg-white text-[#0B1F33] shadow-xs"
                : "text-[#526173] hover:text-[#0B1F33]"
            )}
          >
            All Plans ({plans.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === "active"
                ? "bg-white text-[#0B1F33] shadow-xs"
                : "text-[#526173] hover:text-[#0B1F33]"
            )}
          >
            Active ({plans.filter((p) => p.status !== "draft").length})
          </button>
          <button
            onClick={() => setActiveTab("draft")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === "draft"
                ? "bg-white text-[#0B1F33] shadow-xs"
                : "text-[#526173] hover:text-[#0B1F33]"
            )}
          >
            Drafts ({plans.filter((p) => p.status === "draft").length})
          </button>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F1F4F8] w-fit">
          <button
            onClick={() => setActiveView("grid")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
              activeView === "grid"
                ? "bg-white text-[#0B1F33] shadow-xs"
                : "text-[#526173] hover:text-[#0B1F33]"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tier Cards</span>
          </button>

          <button
            onClick={() => setActiveView("matrix")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
              activeView === "matrix"
                ? "bg-white text-[#0B1F33] shadow-xs"
                : "text-[#526173] hover:text-[#0B1F33]"
            )}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Comparison Matrix</span>
          </button>

          <button
            onClick={() => setActiveView("forecast")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
              activeView === "forecast"
                ? "bg-white text-[#0B1F33] shadow-xs"
                : "text-[#526173] hover:text-[#0B1F33]"
            )}
          >
            <Calculator className="w-3.5 h-3.5 text-[#007A68]" />
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
