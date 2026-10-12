"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import {
  Layers,
  Plus,
  Search,
  Building2,
  Crown,
  Shield,
  CheckCircle2,
  Users,
  Coins,
  RefreshCw,
  Sparkles,
  Edit2,
  Lock,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import {
  MasterPlanBuilderDrawer,
  MasterPlanData
} from "@/components/operations/drawers/MasterPlanBuilderDrawer";

interface PlanSummary {
  totalPlans: number;
  activePlans: number;
  totalEnrolled: number;
  avgVisits: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  gym: "Fitness & Gyms",
  pool: "Aquatic Pools",
  studio: "Yoga & Studios",
  clinic: "Physio & Clinics",
  wellness_center: "Thermal Spas"
};

function OperationsPlansContent() {
  const [plans, setPlans] = useState<MasterPlanData[]>([]);
  const [summary, setSummary] = useState<PlanSummary>({
    totalPlans: 0,
    activePlans: 0,
    totalEnrolled: 0,
    avgVisits: 0
  });
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; slug?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState("all");
  const [selectedTierFilter, setSelectedTierFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MasterPlanData | null>(null);

  // Fetch plans and organizations
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plansRes, clientsRes] = await Promise.all([
        apiFetch<{ plans: MasterPlanData[]; summary: PlanSummary }>("/api/operations/plans"),
        apiFetch<{ clients: Array<{ id: string; name: string; slug: string }> }>("/api/operations/clients")
      ]);

      if (plansRes && Array.isArray(plansRes.plans)) {
        setPlans(plansRes.plans);
        if (plansRes.summary) {
          setSummary(plansRes.summary);
        }
      }

      if (clientsRes && Array.isArray(clientsRes.clients)) {
        setOrganizations(
          clientsRes.clients.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load master benefit plans.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (selectedOrgFilter !== "all" && p.org_id !== selectedOrgFilter) {
        return false;
      }
      if (
        selectedTierFilter !== "all" &&
        (p.tier || "").toLowerCase() !== selectedTierFilter.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedStatusFilter !== "all" &&
        (p.status || "").toLowerCase() !== selectedStatusFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesOrg = p.organization?.name?.toLowerCase().includes(q);
        if (!matchesName && !matchesOrg) return false;
      }
      return true;
    });
  }, [plans, selectedOrgFilter, selectedTierFilter, selectedStatusFilter, searchQuery]);

  const formatRwf = (amt: number) => {
    return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amt) + " RWF";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#21405A]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#28D17C]/15 border border-[#28D17C]/30 flex items-center justify-center text-[#28D17C]">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Master Benefit Plans & Tiers
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] font-semibold border border-[#28D17C]/30">
              AGGREGATOR GOVERNANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Design, author, and deploy corporate wellness packages across the PolyFit aggregator network. Configure contracted visit allowances, eligible provider categories, and employer subsidy baselines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl border border-[#21405A] bg-[#071521] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh Plans"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-[#28D17C]")} />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPlan(null);
              setIsDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Master Plan</span>
          </button>
        </div>
      </div>

      {/* Real-time Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0B1F33] border border-[#21405A] shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Master Plans
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {summary.totalPlans}{" "}
              <span className="text-xs font-normal text-slate-400">
                ({summary.activePlans} active)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#071521] border border-[#21405A] text-[#28D17C] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B1F33] border border-[#21405A] shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Enrolled Beneficiaries
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {summary.totalEnrolled}{" "}
              <span className="text-xs font-normal text-slate-400">staff</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#071521] border border-[#21405A] text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B1F33] border border-[#21405A] shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Avg. Monthly Visit Cap
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {summary.avgVisits}{" "}
              <span className="text-xs font-normal text-slate-400">visits/mo</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#071521] border border-[#21405A] text-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B1F33] border border-[#21405A] shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Aggregator Categories
            </div>
            <div className="text-2xl font-black text-[#28D17C] mt-1 font-mono">
              5{" "}
              <span className="text-xs font-normal text-slate-400">network types</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#071521] border border-[#21405A] text-[#28D17C] flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Omnibar */}
      <div className="p-4 rounded-2xl bg-[#0B1F33] border border-[#21405A] flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plans by name or corporate organization..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#071521] border border-[#21405A] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#28D17C]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Org Filter */}
          <select
            value={selectedOrgFilter}
            onChange={(e) => setSelectedOrgFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#071521] border border-[#21405A] text-xs text-slate-300 focus:outline-none focus:border-[#28D17C] cursor-pointer"
          >
            <option value="all">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#071521] border border-[#21405A] text-xs text-slate-300 focus:outline-none focus:border-[#28D17C] cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="executive">Executive</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#071521] border border-[#21405A] text-xs text-slate-300 focus:outline-none focus:border-[#28D17C] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Plans List Table */}
      <div className="rounded-2xl bg-[#0B1F33] border border-[#21405A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#21405A] bg-[#071521]">
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                  Plan & Tier
                </th>
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                  Target Organization
                </th>
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                  Visit Allowance
                </th>
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                  Covered Categories
                </th>
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                  Co-Pay Baseline
                </th>
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                  Status
                </th>
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21405A]/70">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No master benefit plans found.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchQuery
                        ? "Try clearing your search query or filters."
                        : "Click 'Create Master Plan' above to author your first network package."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const tier = (plan.tier || "standard").toLowerCase();
                  const isExecutive = tier === "executive" || tier === "premium";
                  const isBasic = tier === "basic";

                  return (
                    <tr
                      key={plan.id}
                      className="hover:bg-[#071521]/60 transition-colors group"
                    >
                      {/* Plan & Tier */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              isExecutive
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : isBasic
                                ? "bg-slate-800 text-slate-400 border border-slate-700"
                                : "bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30"
                            )}
                          >
                            {isExecutive ? (
                              <Crown className="w-3 h-3 text-amber-400" />
                            ) : (
                              <Shield className="w-3 h-3" />
                            )}
                            {plan.tier || "Standard"}
                          </span>
                          {plan.is_family_eligible && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-semibold">
                              Family
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white mt-1 group-hover:text-[#28D17C] transition-colors">
                          {plan.name}
                        </div>
                        {plan.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                            {plan.description}
                          </div>
                        )}
                      </td>

                      {/* Target Organization */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#071521] border border-[#21405A] flex items-center justify-center text-slate-400 shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-white truncate max-w-[150px]">
                              {plan.organization?.name || "Corporate Partner"}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {plan.organization?.slug || plan.org_id?.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Visit Allowance */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-white font-mono">
                          {plan.max_monthly_visits} visits/mo
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {plan.budget_cap_per_employee
                            ? `Cap: ${formatRwf(plan.budget_cap_per_employee)}`
                            : "No budget cap"}
                        </div>
                      </td>

                      {/* Covered Categories */}
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(plan.allowed_provider_categories || []).map((cat) => (
                            <span
                              key={cat}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-[#21405A] text-slate-300"
                            >
                              {CATEGORY_LABELS[cat] || cat}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Co-Pay Baseline */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-white">
                          {plan.co_pay_percentage === 0 ? (
                            <span className="text-[#28D17C]">100% Subsidized</span>
                          ) : (
                            <span className="text-amber-400 font-mono">
                              {plan.co_pay_percentage}% Co-Pay
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Baseline cost share
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            plan.status === "active"
                              ? "bg-[#28D17C]/15 text-[#28D17C] border border-[#28D17C]/30"
                              : plan.status === "draft"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          )}
                        >
                          {plan.status || "active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlan(plan);
                            setIsDrawerOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#071521] border border-[#21405A] text-slate-300 hover:text-white hover:border-[#28D17C] text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-[#28D17C]" />
                          <span>Edit Rules</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Master Plan Builder Drawer */}
      <MasterPlanBuilderDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingPlan(null);
        }}
        plan={editingPlan}
        organizations={organizations}
        onSaveSuccess={loadData}
      />
    </div>
  );
}

export default function OperationsPlansPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#28D17C]" />
          <span>Loading master benefit plans console...</span>
        </div>
      }
    >
      <OperationsPlansContent />
    </Suspense>
  );
}
