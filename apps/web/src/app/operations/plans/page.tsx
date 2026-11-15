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
  Filter,
  Sliders,
  Check,
  Save,
  Zap,
  Activity,
  AlertCircle,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  Trophy
} from "lucide-react";
import { cn, rwfLocaleFormatter } from "@/lib/utils";
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

interface PulsesRulesData {
  categoryPulsesWeight: Record<string, number>;
  dailyVisitLimit: number;
  allowMultiVenueDifferentCategory: boolean;
  tierMonthlyCredits: {
    starter: number;
    standard: number;
    executive: number;
  };
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

  // Tab state
  const [activeTab, setActiveTab] = useState<"plans" | "pulses">("plans");

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MasterPlanData | null>(null);

  // Pulses & Access Knobs State
  const [pulsesRules, setPulsesRules] = useState<PulsesRulesData>({
    categoryPulsesWeight: {
      gym: 1,
      pool: 2,
      studio: 2,
      clinic: 3,
      wellness_center: 3,
      sports: 2
    },
    dailyVisitLimit: 1,
    allowMultiVenueDifferentCategory: true,
    tierMonthlyCredits: {
      starter: 10,
      standard: 25,
      executive: 50
    }
  });
  const [initialPulsesRules, setInitialPulsesRules] = useState<PulsesRulesData | null>(null);
  const [isLoadingPulses, setIsLoadingPulses] = useState(false);
  const [isSavingPulses, setIsSavingPulses] = useState(false);
  const [pulsesFeedback, setPulsesFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isPulsesDirty = useMemo(() => {
    if (!initialPulsesRules) return false;
    return JSON.stringify(pulsesRules) !== JSON.stringify(initialPulsesRules);
  }, [pulsesRules, initialPulsesRules]);

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

  const loadPulsesRules = async () => {
    setIsLoadingPulses(true);
    try {
      const res = await apiFetch<PulsesRulesData>("/api/operations/plans/pulses-rules");
      if (res) {
        setPulsesRules(res);
        setInitialPulsesRules(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load pulses access rules.";
      setPulsesFeedback({ type: "error", message: msg });
    } finally {
      setIsLoadingPulses(false);
    }
  };

  const handleSavePulsesRules = async () => {
    setIsSavingPulses(true);
    setPulsesFeedback(null);
    try {
      await apiFetch("/api/operations/plans/pulses-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pulsesRules)
      });
      setInitialPulsesRules(pulsesRules);
      setPulsesFeedback({
        type: "success",
        message: "Platform Pulses access rules & category deduction weights saved successfully!"
      });
      setTimeout(() => setPulsesFeedback(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save pulses access rules.";
      setPulsesFeedback({ type: "error", message: msg });
    } finally {
      setIsSavingPulses(false);
    }
  };

  useEffect(() => {
    loadData();
    loadPulsesRules();
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
    return rwfLocaleFormatter.format(amt) + " RWF";
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
            onClick={activeTab === "plans" ? loadData : loadPulsesRules}
            className="p-2.5 rounded-xl border border-[#21405A] bg-[#071521] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={activeTab === "plans" ? "Refresh Plans" : "Reload Pulses Rules"}
          >
            <RefreshCw
              className={cn(
                "w-4 h-4",
                (isLoading || isLoadingPulses) && "animate-spin text-[#28D17C]"
              )}
            />
          </button>

          {activeTab === "plans" ? (
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
          ) : (
            <button
              type="button"
              onClick={handleSavePulsesRules}
              disabled={isSavingPulses || !isPulsesDirty}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer",
                isPulsesDirty
                  ? "bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33]"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              )}
            >
              {isSavingPulses ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Pulses Rules</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Top Level Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-[#21405A]">
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={cn(
            "flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-all relative border-b-2 cursor-pointer",
            activeTab === "plans"
              ? "border-[#28D17C] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Layers className="w-4 h-4 text-[#28D17C]" />
          <span>Master Benefit Plans</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#28D17C]/15 text-[#28D17C] border border-[#28D17C]/30">
            {plans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pulses")}
          className={cn(
            "flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-all relative border-b-2 cursor-pointer",
            activeTab === "pulses"
              ? "border-[#28D17C] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Credits, Pulses & Access Knobs</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            NETWORK GOVERNOR
          </span>
          {isPulsesDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
          )}
        </button>
      </div>

      {activeTab === "plans" ? (
        <>

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
            <option value="all">All Tiers (4 Plans)</option>
            <option value="basic">Basic (4 Visits)</option>
            <option value="starter">Starter (8 Visits)</option>
            <option value="premium">Premium (12 Visits)</option>
            <option value="executive">Executive (16 Visits)</option>
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
                  Subscription Pricing
                </th>
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                  Visit Allowance
                </th>
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                  Covered Categories
                </th>
                <th className="py-3.5 px-5 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                  Enrolled Beneficiaries
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
                  const tier = (plan.tier || "starter").toLowerCase();
                  const isExecutive = tier === "executive";
                  const isPremium = tier === "premium";
                  const isStarter = tier === "starter";
                  const isBasic = tier === "basic";

                  return (
                    <tr
                      key={plan.id || plan.tier}
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
                                : isPremium
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : isStarter
                                ? "bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            )}
                          >
                            {isExecutive ? (
                              <Crown className="w-3 h-3 text-amber-400" />
                            ) : isPremium ? (
                              <Sparkles className="w-3 h-3 text-purple-400" />
                            ) : (
                              <Shield className="w-3 h-3" />
                            )}
                            {plan.tier ? plan.tier.toUpperCase() : "TIER"}
                          </span>
                          {plan.badge && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                              {plan.badge}
                            </span>
                          )}
                          {plan.is_exclusive && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
                              <span>Exclusive: {plan.organization?.name || "Client Only"}</span>
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

                      {/* Pricing RWF / USD */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-white font-mono text-sm">
                          {formatRwf(plan.monthly_price_rwf || (tier === "basic" ? 10000 : tier === "starter" ? 18000 : tier === "premium" ? 32000 : 50000))}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[#28D17C]">
                            ${plan.monthly_price_usd || (tier === "basic" ? 8 : tier === "starter" ? 14 : tier === "premium" ? 24 : 38)}/mo
                          </span>
                          <span>•</span>
                          <span>15% off annual</span>
                        </div>
                      </td>

                      {/* Visit Allowance */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-white font-mono">
                          {plan.max_monthly_visits} visits/mo
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {plan.co_pay_percentage === 0 ? (
                            <span className="text-[#28D17C] font-semibold">100% Subsidized</span>
                          ) : (
                            <span className="text-amber-400 font-mono">{plan.co_pay_percentage}% Co-Pay</span>
                          )}
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

                      {/* Enrolled Beneficiaries */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-white font-mono flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#28D17C]" />
                          <span>{plan.enrolled_count || 0} enrolled</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Across all partner employers
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlan(plan);
                              setIsDrawerOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#071521] border border-[#21405A] text-slate-300 hover:text-white hover:border-[#28D17C] text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-[#28D17C]" />
                            <span>Edit Plan</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Status / Feedback Banner */}
          {pulsesFeedback && (
            <div
              className={cn(
                "p-4 rounded-xl border flex items-center justify-between transition-all",
                pulsesFeedback.type === "success"
                  ? "bg-[#28D17C]/10 border-[#28D17C]/30 text-[#28D17C]"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              )}
            >
              <div className="flex items-center gap-3">
                {pulsesFeedback.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="text-xs font-semibold">{pulsesFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setPulsesFeedback(null)}
                className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Aggregator Pulses Model Explainer Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0B1F33] via-[#0E2845] to-[#0B1F33] border border-[#21405A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Network Credits (&quot;Pulses&quot;) &amp; Multi-Category Governor</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    LIVE POLICY
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Calibrate the currency weights that convert corporate monthly plan allowances into verified provider check-ins. Premium facilities (Clinics, Thermal Spas) deduct higher pulses per visit to protect provider reimbursement economics while allowing employees complete cross-category freedom.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={loadPulsesRules}
                disabled={isLoadingPulses}
                className="px-3 py-2 rounded-xl border border-[#21405A] bg-[#071521] text-slate-300 hover:text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoadingPulses && "animate-spin text-amber-400")} />
                <span>Reset to Saved</span>
              </button>

              <button
                type="button"
                onClick={handleSavePulsesRules}
                disabled={isSavingPulses || !isPulsesDirty}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-md cursor-pointer",
                  isPulsesDirty
                    ? "bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33]"
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                )}
              >
                {isSavingPulses ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Rules...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Platform Pulses Rules</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 1: Category Pulses Weights (Deduction per Visit) */}
          <div className="p-6 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21405A] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#28D17C]" />
                  <span>Category Pulses Weight (Cost per Visit)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set how many credits/pulses an employee expends when checking in at each provider category.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Default: Gym = 1x | Pool/Studio = 2x | Clinic/Spa = 3x
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  key: "gym",
                  label: "Fitness & Gyms",
                  tag: "Standard Category",
                  desc: "Weight rooms, cardio zones, standard gym floors",
                  icon: Activity,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-500/20"
                },
                {
                  key: "pool",
                  label: "Aquatic Pools",
                  tag: "Aquatics Category",
                  desc: "Lap swimming, aqua fitness, hydrotherapy pools",
                  icon: Sparkles,
                  color: "text-cyan-400",
                  bg: "bg-cyan-500/10 border-cyan-500/20"
                },
                {
                  key: "studio",
                  label: "Yoga & Boutique Studios",
                  tag: "Instructor-Led",
                  desc: "Yoga classes, Reformer Pilates, spinning studios",
                  icon: Users,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10 border-purple-500/20"
                },
                {
                  key: "clinic",
                  label: "Physiotherapy Clinics",
                  tag: "Medical Wellness",
                  desc: "Physio consults, sports recovery, clinical therapy",
                  icon: ShieldCheck,
                  color: "text-rose-400",
                  bg: "bg-rose-500/10 border-rose-500/20"
                },
                {
                  key: "wellness_center",
                  label: "Thermal Spas & Recovery",
                  tag: "Thermal Wellness",
                  desc: "Sauna, steam rooms, cold plunge, relaxation areas",
                  icon: Zap,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10 border-amber-500/20"
                },
                {
                  key: "sports",
                  label: "Padel & Racquet Courts",
                  tag: "Sports Facilities",
                  desc: "Padel courts, tennis courts, badminton & squash",
                  icon: Trophy,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10 border-blue-500/20"
                }
              ].map((cat) => {
                const currentWeight = pulsesRules.categoryPulsesWeight[cat.key] || 1;
                const IconComp = cat.icon;

                return (
                  <div
                    key={cat.key}
                    className="p-4 rounded-xl bg-[#071521] border border-[#21405A] flex flex-col justify-between hover:border-slate-600 transition-all space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", cat.bg, cat.color)}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-white">{cat.label}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {cat.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {cat.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#21405A]/50 flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-slate-400">
                        Deduction per check-in:
                      </div>

                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setPulsesRules((prev) => ({
                                ...prev,
                                categoryPulsesWeight: {
                                  ...prev.categoryPulsesWeight,
                                  [cat.key]: val
                                }
                              }));
                            }}
                            className={cn(
                              "w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                              currentWeight === val
                                ? "bg-[#28D17C] text-[#0B1F33] shadow"
                                : "bg-[#0B1F33] text-slate-400 hover:text-white hover:bg-slate-800 border border-[#21405A]"
                            )}
                          >
                            {val}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Platform Daily Check-in & Anti-Passback Policy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Visit Limit */}
            <div className="p-6 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Daily Verified Visit Cap</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Maximum number of distinct facility check-ins permitted per employee in a single calendar day (00:00 - 23:59).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    val: 1,
                    title: "1 Visit / Day",
                    subtitle: "Strict Anti-Passback",
                    desc: "Optimal fraud guard. Employee can only check in once per day across the network."
                  },
                  {
                    val: 2,
                    title: "2 Visits / Day",
                    subtitle: "Recommended",
                    desc: "Enables active staff to take a morning gym session and evening pool or spa recovery."
                  },
                  {
                    val: 3,
                    title: "3 Visits / Day",
                    subtitle: "High Frequency",
                    desc: "Generous allowance for executive tier beneficiaries with multiple wellness sessions."
                  }
                ].map((option) => {
                  const isSelected = pulsesRules.dailyVisitLimit === option.val;
                  return (
                    <button
                      key={option.val}
                      type="button"
                      onClick={() =>
                        setPulsesRules((prev) => ({
                          ...prev,
                          dailyVisitLimit: option.val
                        }))
                      }
                      className={cn(
                        "p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2",
                        isSelected
                          ? "bg-[#28D17C]/10 border-[#28D17C] text-white shadow-md ring-1 ring-[#28D17C]/30"
                          : "bg-[#071521] border-[#21405A] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-bold font-mono", isSelected ? "text-[#28D17C]" : "text-white")}>
                            {option.title}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#28D17C]" />}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                          {option.subtitle}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {option.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Same-day Multi-Venue Cross-Category Policy */}
            <div className="p-6 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Cross-Category Multi-Venue Policy</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Govern whether an employee who has reached 1 visit today can check into another venue of a different category.
                </p>
              </div>

              <div
                onClick={() =>
                  setPulsesRules((prev) => ({
                    ...prev,
                    allowMultiVenueDifferentCategory: !prev.allowMultiVenueDifferentCategory
                  }))
                }
                className={cn(
                  "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                  pulsesRules.allowMultiVenueDifferentCategory
                    ? "bg-[#28D17C]/10 border-[#28D17C]/40"
                    : "bg-[#071521] border-[#21405A]"
                )}
              >
                <div className="space-y-1 pr-4">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Allow Same-Day Visits Across Different Categories</span>
                    {pulsesRules.allowMultiVenueDifferentCategory ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#28D17C]/20 text-[#28D17C] font-bold">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {pulsesRules.allowMultiVenueDifferentCategory
                      ? "Employees can visit 1 Gym + 1 Pool/Spa on the same day without being blocked. Same-category repeat visits are strictly blocked."
                      : "Strict 1-facility lock: once an employee visits any facility today, all check-ins are locked until midnight."}
                  </p>
                </div>

                <div
                  className={cn(
                    "w-12 h-6 rounded-full p-1 transition-colors relative shrink-0",
                    pulsesRules.allowMultiVenueDifferentCategory ? "bg-[#28D17C]" : "bg-slate-700"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform shadow-md",
                      pulsesRules.allowMultiVenueDifferentCategory ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#071521] border border-[#21405A] text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Anti-Passback window of 3 hours per facility location remains active at all times regardless of daily limit settings.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Monthly Tier Credits Allotments */}
          <div className="p-6 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21405A] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Corporate Tier Monthly Credits Allotments</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Default pulses replenished into employee digital wallets on the 1st of each calendar month.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Purchasing power calculates automatically based on category weights
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  tier: "starter" as const,
                  name: "Starter Benefit Tier",
                  subtitle: "Base Wellness Package",
                  color: "border-slate-700 bg-slate-900/50",
                  icon: Shield,
                  badge: "bg-slate-800 text-slate-300"
                },
                {
                  tier: "standard" as const,
                  name: "Standard Benefit Tier",
                  subtitle: "Most Popular Corporate Plan",
                  color: "border-blue-500/30 bg-blue-950/20",
                  icon: Sparkles,
                  badge: "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                },
                {
                  tier: "executive" as const,
                  name: "Executive Benefit Tier",
                  subtitle: "Full-Spectrum Premium Package",
                  color: "border-amber-500/30 bg-amber-950/20",
                  icon: Crown,
                  badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }
              ].map((tierItem) => {
                const credits = pulsesRules.tierMonthlyCredits[tierItem.tier] || 10;
                const gymWeight = pulsesRules.categoryPulsesWeight["gym"] || 1;
                const poolWeight = pulsesRules.categoryPulsesWeight["pool"] || 2;
                const clinicWeight = pulsesRules.categoryPulsesWeight["clinic"] || 3;

                const maxGymVisits = Math.floor(credits / gymWeight);
                const maxPoolVisits = Math.floor(credits / poolWeight);
                const maxClinicVisits = Math.floor(credits / clinicWeight);

                const TierIcon = tierItem.icon;

                return (
                  <div
                    key={tierItem.tier}
                    className={cn(
                      "p-5 rounded-2xl border space-y-4 flex flex-col justify-between",
                      tierItem.color
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TierIcon className="w-4 h-4 text-white" />
                          <span className="text-xs font-bold text-white">{tierItem.name}</span>
                        </div>
                        <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase", tierItem.badge)}>
                          {tierItem.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {tierItem.subtitle}
                      </p>

                      <div className="pt-2">
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Monthly Credits / Pulses Allowance
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={credits}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setPulsesRules((prev) => ({
                                ...prev,
                                tierMonthlyCredits: {
                                  ...prev.tierMonthlyCredits,
                                  [tierItem.tier]: val
                                }
                              }));
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-[#071521] border border-[#21405A] text-white font-mono font-bold text-sm focus:outline-none focus:border-[#28D17C]"
                          />
                          <span className="text-xs font-mono text-slate-400 shrink-0">
                            pulses/mo
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Purchasing Power Breakdown */}
                    <div className="p-3.5 rounded-xl bg-[#071521] border border-[#21405A] space-y-2">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Network Purchasing Power
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-emerald-400" />
                            <span>Gym Sessions</span>
                          </span>
                          <span className="font-mono font-bold text-white">~{maxGymVisits} visits</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>Pool / Studio</span>
                          </span>
                          <span className="font-mono font-bold text-white">~{maxPoolVisits} visits</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3 text-rose-400" />
                            <span>Physio / Spas</span>
                          </span>
                          <span className="font-mono font-bold text-white">~{maxClinicVisits} visits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
