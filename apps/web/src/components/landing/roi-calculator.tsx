"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Building2,
  Check,
  RefreshCw
} from "lucide-react";
import { useLeadModal } from "@/lib/lead-modal";
import { apiFetch } from "@/lib/api-client";

interface RoiCalculatorProps {
  onOpenLeadForm?: (type: "employer" | "provider") => void;
}

interface TierPreset {
  id: string;
  tier: string;
  name: string;
  badge?: string;
  visits: number;
  monthlyRwf: number;
  annualRwf: number;
  features?: string[];
  popular?: boolean;
}

const CANONICAL_PRESETS: TierPreset[] = [
  {
    id: "basic",
    tier: "basic",
    name: "Basic",
    badge: "Essential",
    visits: 4,
    monthlyRwf: 10000,
    annualRwf: 8500,
    features: [
      "4 verified visits per month across 30+ gyms & strength centers",
      "Dynamic anti-passback mobile web passes",
      "Single consolidated monthly RRA EBM 18% VAT invoice"
    ]
  },
  {
    id: "starter",
    tier: "starter",
    name: "Starter",
    badge: "Growing Teams",
    visits: 8,
    monthlyRwf: 18000,
    annualRwf: 15300,
    features: [
      "8 verified visits per month across 50+ gyms & Olympic lap pools",
      "Dual check-in modality (turnstile QR & desk plaque)",
      "Single consolidated monthly RRA EBM 18% VAT invoice"
    ]
  },
  {
    id: "premium",
    tier: "premium",
    name: "Premium",
    badge: "Most Popular",
    visits: 12,
    monthlyRwf: 32000,
    annualRwf: 27200,
    popular: true,
    features: [
      "12 verified visits per month across 80+ top partner facilities",
      "Full multi-category access: Gyms, Pools, Yoga & Reformer Pilates",
      "Live check-in telemetry and department heatmaps"
    ]
  },
  {
    id: "executive",
    tier: "executive",
    name: "Executive",
    badge: "All Access",
    visits: 16,
    monthlyRwf: 50000,
    annualRwf: 42500,
    features: [
      "16 verified visits per month with all-network access",
      "Gyms, Olympic Pools, Reformer Pilates, Physio Clinics & Thermal Spas",
      "Dedicated PolyFit VIP wellness concierge & HRIS sync"
    ]
  }
];

export default function RoiCalculator({ onOpenLeadForm }: RoiCalculatorProps = {}) {
  const openLeadModal = useLeadModal((s) => s.open);
  const [tiers, setTiers] = useState<TierPreset[]>(CANONICAL_PRESETS);
  const [employees, setEmployees] = useState<number>(100);
  const [selectedTierId, setSelectedTierId] = useState<string>("premium");
  const [budgetPerEmployee, setBudgetPerEmployee] = useState<number>(32000); // Defaults to Premium
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  // Fetch live master plans from backend platform-config so Super Admin edits sync immediately
  useEffect(() => {
    async function loadLivePricingConfig() {
      try {
        const config = await apiFetch<any>("/api/public/platform-config");
        if (config?.pricing && Array.isArray(config.pricing) && config.pricing.length > 0) {
          const mapped: TierPreset[] = config.pricing.map((p: any) => ({
            id: p.id || p.tier,
            tier: p.tier || p.id,
            name: p.name || p.tier,
            badge: p.badge,
            visits: p.visits || p.max_monthly_visits || 8,
            monthlyRwf: Number(p.pricing?.RWF?.monthly || p.monthly_price_rwf || 18000),
            annualRwf: Number(p.pricing?.RWF?.annual || p.annual_price_rwf || Math.round(Number(p.pricing?.RWF?.monthly || 18000) * 0.85)),
            features: Array.isArray(p.features) ? p.features : [],
            popular: Boolean(p.popular || p.is_popular)
          }));
          setTiers(mapped);

          // Update budgetPerEmployee to current tier's live price if matching
          const currentMatch = mapped.find((t) => t.id === selectedTierId || t.tier === selectedTierId);
          if (currentMatch) {
            setBudgetPerEmployee(currentMatch.monthlyRwf);
          }
        }
      } catch {
        // Resilient fallback to canonical presets
      }
    }
    loadLivePricingConfig();
  }, []);

  const activeTier = useMemo(() => {
    return tiers.find((t) => t.id === selectedTierId || t.tier === selectedTierId) || null;
  }, [tiers, selectedTierId]);

  const handleTierSelect = (tierId: string) => {
    setSelectedTierId(tierId);
    if (tierId === "custom") return;

    const match = tiers.find((t) => t.id === tierId || t.tier === tierId);
    if (match) {
      setBudgetPerEmployee(match.monthlyRwf);
    }
  };

  const handleBudgetChange = (value: number) => {
    setBudgetPerEmployee(value);
    const matchingTier = tiers.find((t) => t.monthlyRwf === value);
    if (matchingTier) {
      setSelectedTierId(matchingTier.id);
    } else {
      setSelectedTierId("custom");
    }
  };

  // Calculations
  const monthlyTotalRwf = employees * budgetPerEmployee;
  const annualStandardRwf = monthlyTotalRwf * 12;

  // Annual commitment with 15% prepayment savings if annual billing cycle is active
  const effectiveAnnualRwf = useMemo(() => {
    if (billingCycle === "annual") {
      if (activeTier && activeTier.annualRwf) {
        return employees * activeTier.annualRwf * 12;
      }
      return Math.round(annualStandardRwf * 0.85);
    }
    return annualStandardRwf;
  }, [billingCycle, activeTier, employees, annualStandardRwf]);

  const annualSavingsRwf = annualStandardRwf - effectiveAnnualRwf;

  const formatRwf = (num: number) => {
    return `RWF ${new Intl.NumberFormat("en-US").format(num)}`;
  };

  // Dynamic slider bounds based on live tiers
  const minAllowance = useMemo(() => {
    const minTier = Math.min(...tiers.map((t) => t.monthlyRwf));
    return Math.min(minTier, 10000);
  }, [tiers]);

  const maxAllowance = useMemo(() => {
    const maxTier = Math.max(...tiers.map((t) => t.monthlyRwf));
    return Math.max(maxTier * 1.5, 80000);
  }, [tiers]);

  return (
    <section id="roi-calculator" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white text-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Corporate Budget Planning</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Plan Your Corporate Wellness Allowance
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground mt-3 sm:mt-4 leading-relaxed">
            Estimate your annual corporate wellness investment with transparent pricing synced live from published network tiers.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Controls Card */}
          <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Budget Inputs</h3>
                    <p className="text-xs text-muted-foreground">Adjust team headcount and select plan tier</p>
                  </div>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      billingCycle === "monthly"
                        ? "bg-white text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("annual")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      billingCycle === "annual"
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[9px] bg-white/20 px-1 rounded-sm uppercase tracking-wider font-extrabold">Save 15%</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Plan Tier Preset Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Plan Tier Preset
                  </label>
                  <span className="text-[10px] text-emerald-700 font-mono">Synced Live</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {tiers.map((t) => {
                    const isSelected = selectedTierId === t.id || selectedTierId === t.tier;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTierSelect(t.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate">{t.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </div>
                        <span className={`text-[10px] font-mono font-normal ${isSelected ? "text-slate-300" : "text-muted-foreground"}`}>
                          {new Intl.NumberFormat("en-US").format(t.monthlyRwf)} RWF/mo
                        </span>
                      </button>
                    );
                  })}

                  {/* Custom Option */}
                  <button
                    type="button"
                    onClick={() => handleTierSelect("custom")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer flex flex-col justify-between ${
                      selectedTierId === "custom"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Custom</span>
                      {selectedTierId === "custom" && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </div>
                    <span className={`text-[10px] font-mono font-normal ${selectedTierId === "custom" ? "text-slate-300" : "text-muted-foreground"}`}>
                      Flexible
                    </span>
                  </button>
                </div>
              </div>

              {/* Slider 1: Employee Count */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2.5">
                  <label htmlFor="roi-employees-slider" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Employee Headcount
                  </label>
                  <span className="text-sm font-bold text-emerald-800 bg-emerald-500/10 px-2.5 py-1 rounded-md font-mono">
                    {employees} Employees
                  </span>
                </div>
                <input
                  id="roi-employees-slider"
                  name="roi-employees"
                  aria-label="Employee Headcount Slider"
                  type="range"
                  min="5"
                  max="1000"
                  step="5"
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1 font-medium font-mono">
                  <span>5 staff</span>
                  <span>500</span>
                  <span>1,000+ staff</span>
                </div>
              </div>

              {/* Slider 2: Monthly Budget per Employee */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2.5">
                  <label htmlFor="roi-budget-slider" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Monthly Allowance / Employee
                  </label>
                  <span className="text-sm font-bold text-emerald-800 bg-emerald-500/10 px-2.5 py-1 rounded-md font-mono">
                    {formatRwf(budgetPerEmployee)} / mo
                  </span>
                </div>
                <input
                  id="roi-budget-slider"
                  name="roi-budget"
                  aria-label="Monthly Allowance per Employee Slider"
                  type="range"
                  min={minAllowance}
                  max={maxAllowance}
                  step="500"
                  value={budgetPerEmployee}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1 font-medium font-mono">
                  <span>{new Intl.NumberFormat("en-US").format(minAllowance)} RWF</span>
                  <span>{new Intl.NumberFormat("en-US").format(Math.round((minAllowance + maxAllowance) / 2))}</span>
                  <span>{new Intl.NumberFormat("en-US").format(maxAllowance)} RWF</span>
                </div>
              </div>
            </div>

            {/* Total Spend Summary Box */}
            <div className="mt-4 bg-slate-50 border border-border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projected Monthly Total</p>
                <p className="text-xl font-extrabold text-foreground font-mono">{formatRwf(monthlyTotalRwf)}</p>
              </div>
              <Link 
                href="/pricing"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>Compare All 4 Plans</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Results Display Card */}
          <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden border border-white/10">
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Investment Summary
                </span>
                <span className="text-xs font-medium bg-white/10 text-gray-200 px-2.5 py-1 rounded-full">
                  {billingCycle === "annual" ? "Annual Prepayment Plan" : "12-Month Projection"}
                </span>
              </div>

              {/* Main Investment Metric */}
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-400 mb-1">
                  {billingCycle === "annual" ? "Total Discounted Annual Commitment" : "Total Projected Annual Commitment"}
                </p>
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                  {formatRwf(effectiveAnnualRwf)}
                </p>
                {annualSavingsRwf > 0 && billingCycle === "annual" && (
                  <p className="text-xs font-semibold text-emerald-300 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Includes 15% Annual Prepayment Savings ({formatRwf(annualSavingsRwf)} saved)</span>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {activeTier
                    ? `Full wellness coverage for all ${employees} eligible corporate employees under the ${activeTier.name} Tier (${activeTier.visits} verified visits/month).`
                    : `Custom wellness benefit allocation for all ${employees} eligible corporate employees.`}
                </p>
              </div>

              {/* Dynamic Feature Bullets from Live Master Plan or Platform Assurances */}
              <div className="space-y-3 border-t border-white/10 pt-6 mb-6">
                {activeTier && activeTier.features && activeTier.features.length > 0 ? (
                  activeTier.features.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-2.5 text-xs text-gray-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Single corporate contract with consolidated 18% VAT RRA EBM monthly billing</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-gray-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Dynamic TOTP QR check-in tracking across verified partner locations in Kigali</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-gray-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Real-time department utilization telemetry and employee roster administration</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                if (onOpenLeadForm) {
                  onOpenLeadForm("employer");
                } else {
                  openLeadModal("employer");
                }
              }}
              aria-label="Talk to us to receive a custom proposal"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-xl font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              <span>Talk to Us for an Itemized Proposal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
