"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Layers,
  Crown,
  Shield,
  CheckCircle2,
  Building2,
  Percent,
  Calendar,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Users,
  Coins,
  ChevronDown,
  Plus,
  MinusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

export interface MasterPlanData {
  id?: string;
  org_id?: string;
  name: string;
  tier?: string;
  max_monthly_visits: number;
  co_pay_percentage?: number;
  monthly_price_rwf?: number;
  annual_price_rwf?: number;
  monthly_price_usd?: number;
  annual_price_usd?: number;
  allowed_provider_categories: string[];
  budget_cap_per_employee?: number | null;
  is_family_eligible?: boolean;
  enrolled_count?: number;
  target_audience?: string;
  badge?: string;
  is_popular?: boolean;
  description?: string;
  features?: string[];
  not_included?: string[];
  notIncluded?: string[];
  is_exclusive?: boolean;
  status: "active" | "draft" | "inactive";
  organization?: {
    id: string;
    name: string;
    slug?: string;
  };
}

interface OrganizationOption {
  id: string;
  name: string;
  slug?: string;
}

interface MasterPlanBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: MasterPlanData | null;
  organizations?: OrganizationOption[];
  onSaveSuccess: () => void;
}

const CATEGORY_OPTIONS = [
  {
    id: "gym",
    label: "Fitness Centers & Strength",
    desc: "Cardio suites, free weights, resistance machines, and strength hubs."
  },
  {
    id: "pool",
    label: "Aquatic & Lap Pools",
    desc: "Olympic pools, hotel lap pools, and aquatic conditioning centers."
  },
  {
    id: "studio",
    label: "Yoga, Pilates & Group Studios",
    desc: "Reformer pilates, hot yoga, HIIT, spin, and boutique movement classes."
  },
  {
    id: "clinic",
    label: "Physiotherapy & Sports Clinics",
    desc: "Musculoskeletal therapy, sports rehabilitation, and injury prevention."
  },
  {
    id: "wellness_center",
    label: "Thermal & Holistic Wellness Centers",
    desc: "Sauna, steam baths, hydrotherapy, and recovery spaces."
  }
];

const TIER_OPTIONS = [
  { id: "basic", label: "Basic", desc: "4 visits/mo • Fitness centers & strength", icon: Layers },
  { id: "starter", label: "Starter", desc: "8 visits/mo • Gyms + Olympic lap pools", icon: Shield },
  { id: "premium", label: "Premium", desc: "12 visits/mo • Gyms, pools + yoga/pilates", icon: Crown },
  { id: "executive", label: "Executive", desc: "16 visits/mo • All-access + clinics & spas", icon: Crown }
];

const DEFAULT_TIER_FEATURES: Record<string, { features: string[]; notIncluded: string[] }> = {
  basic: {
    features: [
      "4 verified visits per month",
      "Access to 30+ vetted wellness providers & facilities",
      "Consolidated monthly RRA EBM 18% VAT invoice",
      "Dynamic anti-passback mobile passes",
      "Standard monthly employee utilization report",
      "Standard email support (24h SLA)"
    ],
    notIncluded: [
      "Aquatic pools & Olympic lap access",
      "Yoga & Reformer Pilates studios",
      "Thermal spas & clinical physiotherapy",
      "Dedicated wellness concierge"
    ]
  },
  starter: {
    features: [
      "8 verified visits per month",
      "Access to 50+ network facilities & Olympic lap pools",
      "Single consolidated RRA EBM monthly invoice",
      "Dual check-in modality (turnstile QR & desk plaque)",
      "Live department utilization telemetry",
      "Standard employee roster upload (CSV)",
      "Priority support (12h SLA)"
    ],
    notIncluded: [
      "Yoga & Reformer Pilates studios",
      "Thermal spas & clinical physiotherapy",
      "Dedicated wellness concierge"
    ]
  },
  premium: {
    features: [
      "12 verified visits per month",
      "Full multi-category access: Fitness, Pools, Yoga & Pilates",
      "Access to 80+ top partner facilities across Kigali",
      "Instant anti-passback biometric & geo lock",
      "Live check-in telemetry & department heatmaps",
      "Quarterly corporate wellness impact review",
      "Priority support via WhatsApp & phone (4h SLA)"
    ],
    notIncluded: [
      "Thermal spas & clinical physiotherapy"
    ]
  },
  executive: {
    features: [
      "16 verified visits per month",
      "Unrestricted all-category access across entire network",
      "Fitness Facilities, Olympic Pools, Reformer Pilates, Physio Clinics & Spas",
      "Zero employee co-pay (100% employer sponsored)",
      "Dedicated PolyFit VIP wellness concierge",
      "Custom corporate health challenges & executive reviews",
      "Direct HRIS integration & automated webhook sync"
    ],
    notIncluded: []
  }
};

export function MasterPlanBuilderDrawer({
  isOpen,
  onClose,
  plan,
  organizations = [],
  onSaveSuccess
}: MasterPlanBuilderDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [tier, setTier] = useState<string>("starter");
  const [maxVisits, setMaxVisits] = useState(8);
  const [budgetCap, setBudgetCap] = useState<number | "">("");
  const [isFamilyEligible, setIsFamilyEligible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "gym",
    "pool",
    "studio"
  ]);
  const [monthlyPriceRwf, setMonthlyPriceRwf] = useState<number>(18000);
  const [annualPriceRwf, setAnnualPriceRwf] = useState<number>(15300);
  const [monthlyPriceUsd, setMonthlyPriceUsd] = useState<number>(14);
  const [annualPriceUsd, setAnnualPriceUsd] = useState<number>(12);
  const [badge, setBadge] = useState<string>("");
  const [targetAudience, setTargetAudience] = useState<string>("");
  const [status, setStatus] = useState<"active" | "draft" | "inactive">("active");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [notIncluded, setNotIncluded] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState("");
  const [newNotIncludedInput, setNewNotIncludedInput] = useState("");
  const [isExclusive, setIsExclusive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when drawer opens or plan changes
  useEffect(() => {
    if (plan) {
      setName(plan.name || "");
      setOrgId(plan.org_id || "");
      setIsExclusive(Boolean(plan.is_exclusive || plan.org_id));
      setTier(plan.tier || "starter");
      setMaxVisits(plan.max_monthly_visits || 8);
      setMonthlyPriceRwf(Number(plan.monthly_price_rwf || (plan.tier === "basic" ? 10000 : plan.tier === "premium" ? 32000 : plan.tier === "executive" ? 50000 : 18000)));
      setAnnualPriceRwf(Number(plan.annual_price_rwf || Math.round((plan.monthly_price_rwf || 18000) * 0.85)));
      setMonthlyPriceUsd(Number(plan.monthly_price_usd || (plan.tier === "basic" ? 8 : plan.tier === "premium" ? 24 : plan.tier === "executive" ? 38 : 14)));
      setAnnualPriceUsd(Number(plan.annual_price_usd || Math.round((plan.monthly_price_usd || 14) * 0.85)));
      setBadge(plan.badge || (plan.tier === "premium" ? "Most Popular" : plan.tier === "executive" ? "All Access" : plan.tier === "starter" ? "Growing Teams" : "Essential"));
      setTargetAudience(plan.target_audience || "");
      setBudgetCap(plan.budget_cap_per_employee != null ? Number(plan.budget_cap_per_employee) : "");
      setIsFamilyEligible(Boolean(plan.is_family_eligible));
      setSelectedCategories(plan.allowed_provider_categories || ["gym", "pool"]);
      setStatus(plan.status || "active");
      setDescription(plan.description || "");

      const planTier = (plan.tier || "starter").toLowerCase();
      const fallbackDefs = DEFAULT_TIER_FEATURES[planTier] || DEFAULT_TIER_FEATURES.starter;
      const initialFeatures = Array.isArray(plan.features) && plan.features.length > 0
        ? plan.features
        : fallbackDefs.features;
      const initialNotIncluded = Array.isArray(plan.not_included)
        ? plan.not_included
        : (Array.isArray(plan.notIncluded) ? plan.notIncluded : fallbackDefs.notIncluded);

      setFeatures([...initialFeatures]);
      setNotIncluded([...initialNotIncluded]);
    } else {
      setName("");
      setOrgId(organizations[0]?.id || "");
      setTier("starter");
      setMaxVisits(8);
      setMonthlyPriceRwf(18000);
      setAnnualPriceRwf(15300);
      setMonthlyPriceUsd(14);
      setAnnualPriceUsd(12);
      setBadge("Growing Teams");
      setTargetAudience("Up to 50 employees");
      setBudgetCap("");
      setIsFamilyEligible(false);
      setSelectedCategories(["gym", "pool"]);
      setStatus("active");
      setDescription("");
      setIsExclusive(false);
      const defaults = DEFAULT_TIER_FEATURES.starter;
      setFeatures([...defaults.features]);
      setNotIncluded([...defaults.notIncluded]);
    }
    setNewFeatureInput("");
    setNewNotIncludedInput("");
    setError(null);
  }, [plan, isOpen, organizations]);

  // Auto-adjust default visits & pricing when tier changes in new mode
  const handleSelectTier = (newTier: string) => {
    setTier(newTier);
    if (!plan) {
      const defaults = DEFAULT_TIER_FEATURES[newTier] || DEFAULT_TIER_FEATURES.starter;
      setFeatures([...defaults.features]);
      setNotIncluded([...defaults.notIncluded]);

      if (newTier === "basic") {
        setMaxVisits(4);
        setMonthlyPriceRwf(10000);
        setAnnualPriceRwf(8500);
        setMonthlyPriceUsd(8);
        setAnnualPriceUsd(7);
        setBadge("Essential");
        setSelectedCategories(["gym"]);
      } else if (newTier === "starter") {
        setMaxVisits(8);
        setMonthlyPriceRwf(18000);
        setAnnualPriceRwf(15300);
        setMonthlyPriceUsd(14);
        setAnnualPriceUsd(12);
        setBadge("Growing Teams");
        setSelectedCategories(["gym", "pool"]);
      } else if (newTier === "premium") {
        setMaxVisits(12);
        setMonthlyPriceRwf(32000);
        setAnnualPriceRwf(27200);
        setMonthlyPriceUsd(24);
        setAnnualPriceUsd(20);
        setBadge("Most Popular");
        setSelectedCategories(["gym", "pool", "studio"]);
      } else if (newTier === "executive") {
        setMaxVisits(16);
        setMonthlyPriceRwf(50000);
        setAnnualPriceRwf(42500);
        setMonthlyPriceUsd(38);
        setAnnualPriceUsd(32);
        setBadge("All Access");
        setSelectedCategories(["gym", "pool", "studio", "clinic", "wellness_center"]);
      }
    }
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFeatures((prev) => [...prev, newFeatureInput.trim()]);
    setNewFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddNotIncluded = () => {
    if (!newNotIncludedInput.trim()) return;
    setNotIncluded((prev) => [...prev, newNotIncludedInput.trim()]);
    setNewNotIncludedInput("");
  };

  const handleRemoveNotIncluded = (index: number) => {
    setNotIncluded((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleDelete = async () => {
    if (!plan?.id) return;

    try {
      setIsSubmitting(true);
      await apiFetch(`/api/operations/plans/${plan.id}`, { method: "DELETE" });
      onSaveSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to archive plan.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a master plan name.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Please select at least one covered provider category.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        org_id: isExclusive && orgId ? orgId : undefined,
        is_exclusive: isExclusive,
        name: name.trim(),
        tier,
        max_monthly_visits: Number(maxVisits),
        monthly_price_rwf: Number(monthlyPriceRwf),
        annual_price_rwf: Number(annualPriceRwf),
        monthly_price_usd: Number(monthlyPriceUsd),
        annual_price_usd: Number(annualPriceUsd),
        badge: badge.trim() || undefined,
        target_audience: targetAudience.trim() || undefined,
        allowed_provider_categories: selectedCategories,
        budget_cap_per_employee: budgetCap !== "" ? Number(budgetCap) : null,
        is_family_eligible: isFamilyEligible,
        status,
        description: description.trim() || null,
        features,
        not_included: notIncluded
      };

      if (plan?.id) {
        await apiFetch(`/api/operations/plans/${plan.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/api/operations/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      onSaveSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save master plan. Please check inputs.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="master-plan-builder-title">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in-50 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-50 w-full max-w-xl bg-[#0B1F33] border-l border-[#21405A] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 overflow-hidden text-white select-none">
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-[#21405A] bg-[#071521] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#28D17C]/15 border border-[#28D17C]/30 flex items-center justify-center text-[#28D17C]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="master-plan-builder-title"
                className="text-sm font-bold text-white tracking-wide flex items-center gap-2"
              >
                <span>{plan?.id ? "Edit Master Benefit Plan" : "Master Plan Builder"}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#28D17C]/20 text-[#28D17C] font-semibold border border-[#28D17C]/30">
                  OPS GOVERNANCE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Author aggregator tier access rules, category allowances, and visit caps.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close master plan builder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Plan Scope: Global Public vs Client-Exclusive Enterprise */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-[#071521] border border-[#21405A]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#28D17C]" />
                <span>Plan Scope & Visibility</span>
              </label>
              <span className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold",
                isExclusive
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              )}>
                {isExclusive ? "CLIENT EXCLUSIVE (HIDDEN PUBLICLY)" : "GLOBAL NETWORK (PUBLIC)"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsExclusive(false)}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                  !isExclusive
                    ? "bg-[#28D17C]/15 border-[#28D17C] text-white shadow-xs"
                    : "bg-[#0B1F33] border-[#21405A] text-slate-400 hover:text-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Global Network Tier</span>
                  {!isExclusive && <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]" />}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Published on marketing pricing & ROI calculator for all clients.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsExclusive(true)}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                  isExclusive
                    ? "bg-amber-500/15 border-amber-500 text-white shadow-xs"
                    : "bg-[#0B1F33] border-[#21405A] text-slate-400 hover:text-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Client-Exclusive Tier</span>
                  {isExclusive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Hidden from public site. Custom-contracted for a specific enterprise client.
                </span>
              </button>
            </div>

            {/* If Client-Exclusive, pick the dedicated client organization */}
            {isExclusive && (
              <div className="space-y-1.5 pt-2 border-t border-[#21405A]/70 animate-in fade-in-50 duration-200">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Exclusive Client Organization</span>
                  <span className="text-[9px] text-amber-400 font-mono">DEDICATED ACCOUNT</span>
                </label>
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
                  required={isExclusive}
                >
                  <option value="" disabled className="bg-[#0B1F33] text-slate-400">Select enterprise client...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id} className="bg-[#0B1F33] text-white">
                      {org.name} {org.slug ? `(${org.slug})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Only eligible employees and HR administrators of this organization will see and access this plan.
                </p>
              </div>
            )}
          </div>

          {/* Plan Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Plan Name</span>
              <span className="text-[10px] text-slate-400 font-mono">DISPLAY NAME</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Enterprise Premium Wellness Tier"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071521] border border-[#21405A] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#28D17C] transition-colors"
              required
            />
          </div>

          {/* Tier Classification */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 block">
              Tier Classification
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIER_OPTIONS.map((t) => {
                const Icon = t.icon;
                const isSelected = tier === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTier(t.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                      isSelected
                        ? "bg-[#28D17C]/15 border-[#28D17C] text-white shadow-xs"
                        : "bg-[#071521] border-[#21405A] text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={cn("w-4 h-4", isSelected ? "text-[#28D17C]" : "text-slate-400")} />
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white capitalize">{t.label}</div>
                      <div className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visit Quota Allowance & HR Co-Pay Policy Architecture */}
          <div className="p-3.5 rounded-2xl bg-[#071521] border border-[#21405A] space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Monthly Visit Cap</span>
                <span className="text-[10px] text-slate-400 font-mono">VISITS / MO PER EMPLOYEE</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={maxVisits}
                  onChange={(e) => setMaxVisits(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white font-mono focus:outline-none focus:border-[#28D17C]"
                />
              </div>
              <div className="flex gap-1.5 pt-1">
                {[4, 8, 12, 16, 24].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMaxVisits(v)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer border transition-colors",
                      maxVisits === v
                        ? "bg-[#28D17C]/20 border-[#28D17C] text-[#28D17C]"
                        : "bg-slate-900 border-[#21405A] text-slate-400 hover:text-white"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#21405A]/60 flex items-start gap-2 text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-300">Subsidy & Co-Pay Authority:</strong> Configured exclusively by client HR administrators in the Corporate Portal based on employer wellness benefit budget.
              </span>
            </div>
          </div>

          {/* Subscription Pricing Architecture */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-[#071521] border border-[#21405A]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#28D17C]" />
                <span>Aggregator Tier Pricing (Per Employee)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">RRA EBM INVOICING</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Monthly Price (RWF)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={monthlyPriceRwf}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMonthlyPriceRwf(val);
                      setAnnualPriceRwf(Math.round(val * 0.85));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white font-mono focus:outline-none focus:border-[#28D17C]"
                  />
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">RWF</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Annual Price (RWF/mo)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={annualPriceRwf}
                    onChange={(e) => setAnnualPriceRwf(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white font-mono focus:outline-none focus:border-[#28D17C]"
                  />
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">RWF</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Monthly Price (USD)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={monthlyPriceUsd}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMonthlyPriceUsd(val);
                      setAnnualPriceUsd(Math.round(val * 0.85));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white font-mono focus:outline-none focus:border-[#28D17C]"
                  />
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">USD</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Annual Price (USD/mo)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={annualPriceUsd}
                    onChange={(e) => setAnnualPriceUsd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white font-mono focus:outline-none focus:border-[#28D17C]"
                  />
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">USD</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Public Badge</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Most Popular"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#28D17C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Target Cohort</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. 50 to 500 staff"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#28D17C]"
                />
              </div>
            </div>
          </div>

          {/* Covered Provider Categories (Aggregator Multi-Category Architecture) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 block">
                Covered Provider Network Categories
              </label>
              <span className="text-[10px] font-mono text-[#28D17C]">
                {selectedCategories.length} Categories Active
              </span>
            </div>
            <div className="space-y-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const isChecked = selectedCategories.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all",
                      isChecked
                        ? "bg-[#28D17C]/10 border-[#28D17C]/40 text-white"
                        : "bg-[#071521] border-[#21405A] text-slate-400 hover:border-slate-600"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0",
                        isChecked
                          ? "bg-[#28D17C] border-[#28D17C] text-[#0B1F33]"
                          : "border-slate-500 bg-transparent"
                      )}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#0B1F33]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{cat.label}</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          ({cat.id})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                        {cat.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget Cap & Family Pass Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Employee Budget Cap (Optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Unlimited"
                  value={budgetCap}
                  onChange={(e) => setBudgetCap(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071521] border border-[#21405A] text-xs text-white font-mono focus:outline-none focus:border-[#28D17C]"
                />
                <span className="text-xs font-mono text-slate-400">RWF</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Family Pass Eligibility
              </label>
              <button
                type="button"
                onClick={() => setIsFamilyEligible(!isFamilyEligible)}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all",
                  isFamilyEligible
                    ? "bg-blue-500/15 border-blue-500 text-blue-300"
                    : "bg-[#071521] border-[#21405A] text-slate-400"
                )}
              >
                <span>Family Dependent Passes</span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full",
                    isFamilyEligible
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-slate-800 text-slate-400"
                  )}
                >
                  {isFamilyEligible ? "ENABLED" : "DISABLED"}
                </span>
              </button>
            </div>
          </div>

          {/* Plan Inclusions (What's Included) */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-[#071521] border border-[#21405A]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C]" />
                <span>What&apos;s Included ({features.length})</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">VISIBLE IN PRICING & PORTALS</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-slate-200"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C] shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {features.length === 0 && (
                <p className="text-[11px] text-slate-500 italic p-2">No included items added yet.</p>
              )}
            </div>

            {/* Add new feature input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Add included feature (press Enter)..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#28D17C]"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-2 rounded-xl bg-[#28D17C]/15 border border-[#28D17C]/40 text-[#28D17C] hover:bg-[#28D17C]/25 text-xs font-semibold cursor-pointer shrink-0 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Plan Exclusions (What's NOT Included) */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-[#071521] border border-[#21405A]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>What&apos;s NOT Included ({notIncluded.length})</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">SHOWN WITH STRIKETHROUGH</span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {notIncluded.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-slate-400"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-amber-400 font-mono font-bold">—</span>
                    <span className="truncate line-through opacity-80">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNotIncluded(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {notIncluded.length === 0 && (
                <p className="text-[11px] text-slate-500 italic p-2">No exclusions (all network benefits accessible).</p>
              )}
            </div>

            {/* Add new exclusion input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newNotIncludedInput}
                onChange={(e) => setNewNotIncludedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNotIncluded();
                  }
                }}
                placeholder="Add excluded item (press Enter)..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddNotIncluded}
                className="px-3 py-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-400 hover:bg-amber-400/25 text-xs font-semibold cursor-pointer shrink-0 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Status & Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 block">Plan Status</label>
            <div className="flex gap-2">
              {(["active", "draft", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border",
                    status === s
                      ? s === "active"
                        ? "bg-[#28D17C]/20 border-[#28D17C] text-[#28D17C]"
                        : s === "draft"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-[#071521] border-[#21405A] text-slate-400 hover:text-white"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 block">Plan Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of facility access, amenities, and policy guidelines shown in the mobile employee app..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071521] border border-[#21405A] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#28D17C] transition-colors resize-none"
            />
          </div>
        </form>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#21405A] bg-[#071521] flex items-center justify-between gap-3 shrink-0">
          {plan?.id ? (
            showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-300 font-semibold">Deactivate plan?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                  className="px-2 py-1 rounded-lg bg-[#0F283D] hover:bg-[#183954] text-slate-300 text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all cursor-pointer"
              >
                Deactivate Plan
              </button>
            )
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#21405A] text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Deploying...</span>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>{plan?.id ? "Update Master Plan" : "Deploy Master Plan"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
