"use client";

import React, { useState } from "react";
import { Check, X, Crown, Shield, Layers, UserPlus, Edit2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BenefitPlan } from "./PlanCard";

interface PlanComparisonMatrixProps {
  plans: BenefitPlan[];
  onEdit: (plan: BenefitPlan) => void;
  onAssign: (plan: BenefitPlan) => void;
}

const ALL_CATEGORIES = [
  { key: "gym", label: "Fitness & Gyms" },
  { key: "pool", label: "Olympic & Leisure Pools" },
  { key: "studio", label: "Boutique Yoga & Pilates Studios" },
  { key: "clinic", label: "Physiotherapy & Sports Clinics" },
  { key: "wellness_center", label: "Holistic Wellness Centers" }
];

export const PlanComparisonMatrix: React.FC<PlanComparisonMatrixProps> = ({
  plans,
  onEdit,
  onAssign
}) => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);

  if (!plans || plans.length === 0) {
    return null;
  }

  const formatRwf = (amt: number) => {
    return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amt) + " RWF";
  };

  return (
    <div className="pf-matrix-container">
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Side-by-Side Tier Matrix</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compare benefit entitlements, subsidy splits, and facility access across active corporate plans.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary/15 text-secondary-foreground border border-secondary/20">
              {plans.length} Tiers Active
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="py-4 px-6 w-1/4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Benefit Feature
                </th>
                {plans.map((p) => {
                  const tier = (p.tier || "standard").toLowerCase();
                  const isExecutive = tier === "executive" || tier === "premium";
                  return (
                    <th key={p.id} className="py-4 px-6 font-bold text-foreground text-sm">
                      <div className="flex items-center gap-2">
                        {isExecutive ? (
                          <Crown className="w-4 h-4 text-amber-500" />
                        ) : tier === "basic" ? (
                          <Layers className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Shield className="w-4 h-4 text-accent" />
                        )}
                        <span>{p.name}</span>
                      </div>
                      <div className="text-[11px] font-normal text-muted-foreground mt-0.5 capitalize">
                        {p.tier || "Standard Tier"}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {/* Monthly Visits */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-6 font-medium text-foreground">Monthly Visit Quota</td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-6 font-bold text-foreground font-mono">
                    {p.max_monthly_visits} visits / month
                  </td>
                ))}
              </tr>

              {/* Co-Pay Rule */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-6 font-medium text-foreground">Employee Co-Pay</td>
                {plans.map((p) => {
                  const copay = Number(p.co_pay_percentage || 0);
                  return (
                    <td key={p.id} className="py-3.5 px-6">
                      {copay === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent">
                          0% (100% Employer Funded)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          {copay}% Employee Co-Pay
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Budget Cap */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-6 font-medium text-foreground">Monthly Budget Cap / Employee</td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-6 font-mono text-foreground">
                    {p.budget_cap_per_employee ? formatRwf(p.budget_cap_per_employee) : "Unlimited Cap"}
                  </td>
                ))}
              </tr>

              {/* Family Pass */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-6 font-medium text-foreground">Family / Dependent Pass</td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-6">
                    {p.is_family_eligible ? (
                      <span className="inline-flex items-center gap-1 text-accent font-semibold">
                        <Check className="w-4 h-4 text-accent" /> Included
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground/70">
                        <X className="w-4 h-4 text-muted-foreground/50" /> Employee Only
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Collapsible Provider Categories Header */}
              <tr className="bg-muted/50 border-t border-b border-border">
                <td colSpan={plans.length + 1} className="py-2.5 px-6">
                  <button
                    type="button"
                    onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                    aria-expanded={isCategoriesOpen}
                    aria-controls="category-breakdown-rows"
                    className="flex items-center justify-between w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm cursor-pointer"
                  >
                    <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                      <span>Covered Provider Categories ({ALL_CATEGORIES.length})</span>
                      <span className="text-[10px] font-normal text-muted-foreground lowercase">
                        (click to {isCategoriesOpen ? "collapse" : "expand"})
                      </span>
                    </span>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-transform duration-200",
                        isCategoriesOpen ? "rotate-180" : ""
                      )}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </td>
              </tr>

              {/* Provider Categories Rows with Native CSS Height Interpolation */}
              {ALL_CATEGORIES.map((cat) => (
                <tr
                  key={cat.key}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    !isCategoriesOpen && "hidden"
                  )}
                >
                  <td className="py-3 px-6 text-muted-foreground pl-8">
                    <div
                      className={cn(
                        "pf-accordion-content flex items-center gap-2",
                        isCategoriesOpen && "is-open"
                      )}
                      data-state={isCategoriesOpen ? "open" : "closed"}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                      <span>{cat.label}</span>
                    </div>
                  </td>
                  {plans.map((p) => {
                    const isAllowed = (p.allowed_provider_categories || []).includes(cat.key);
                    return (
                      <td key={p.id} className="py-3 px-6">
                        <div
                          className={cn(
                            "pf-accordion-content flex items-center",
                            isCategoriesOpen && "is-open"
                          )}
                          data-state={isCategoriesOpen ? "open" : "closed"}
                        >
                          {isAllowed ? (
                            <div className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground/60 flex items-center justify-center">
                              <X className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Enrolled Headcount */}
              <tr className="hover:bg-muted/30 transition-colors bg-muted/20">
                <td className="py-3.5 px-6 font-medium text-foreground">Enrolled Roster</td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-6 font-bold text-foreground font-mono">
                    {p.enrolled_count || 0} employees
                  </td>
                ))}
              </tr>

              {/* Estimated Cost Per Employee */}
              <tr className="hover:bg-muted/30 transition-colors bg-muted/20">
                <td className="py-3.5 px-6 font-medium text-foreground">Est. Employer Cost / Member</td>
                {plans.map((p) => {
                  const visits = p.max_monthly_visits || 6;
                  const copay = Number(p.co_pay_percentage || 0);
                  const cost = Math.round(visits * 5000 * (1 - copay / 100));
                  return (
                    <td key={p.id} className="py-3.5 px-6 font-bold text-foreground font-mono">
                      ~{formatRwf(cost)} / mo
                    </td>
                  );
                })}
              </tr>

              {/* Action Row */}
              <tr>
                <td className="py-4 px-6 font-semibold text-muted-foreground">Actions</td>
                {plans.map((p) => (
                  <td key={p.id} className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAssign(p)}
                        className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3 text-secondary" />
                        <span>Assign</span>
                      </button>
                      <button
                        onClick={() => onEdit(p)}
                        className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
