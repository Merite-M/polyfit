"use client";

import React, { useState } from "react";
import {
  Crown,
  Shield,
  Layers,
  CheckCircle2,
  Users,
  Building2,
  Edit2,
  UserPlus,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BenefitPlan {
  id: string;
  org_id?: string;
  name: string;
  tier?: string | null;
  status?: string;
  max_monthly_visits: number;
  co_pay_percentage: number;
  allowed_provider_categories: string[];
  allowed_locations?: string[] | null;
  budget_cap_per_employee?: number | null;
  is_family_eligible?: boolean;
  description?: string | null;
  enrolled_count?: number;
  departments?: string[];
  department_counts?: Record<string, number>;
  estimated_monthly_liability?: number;
  effective_timing?: string;
  effective_date?: string;
}

interface PlanCardProps {
  plan: BenefitPlan;
  onEdit: (plan: BenefitPlan) => void;
  onAssign: (plan: BenefitPlan) => void;
  onSelectCompare?: (plan: BenefitPlan) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  gym: "Fitness & Gyms",
  pool: "Swimming Pools",
  studio: "Yoga & Pilates",
  clinic: "Physio & Health",
  wellness_center: "Wellness Centers"
};

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onEdit,
  onAssign,
  onSelectCompare
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const tier = (plan.tier || "standard").toLowerCase();
  const isExecutive = tier === "executive" || tier === "premium";
  const isBasic = tier === "basic";
  const isDraft = plan.status === "draft";

  const enrolled = plan.enrolled_count || 0;
  const visits = plan.max_monthly_visits;
  const copay = Number(plan.co_pay_percentage || 0);
  const budgetCap = plan.budget_cap_per_employee;

  // Format currency
  const formatRwf = (amt: number) => {
    return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amt) + " RWF";
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl bg-card border transition-all duration-200 hover:shadow-md",
        isExecutive
          ? "border-primary/20 shadow-xs"
          : isDraft
          ? "border-dashed border-border bg-muted/20"
          : "border-border shadow-xs"
      )}
    >
      {/* Top Accent Strip */}
      <div
        className={cn(
          "h-1.5 w-full rounded-t-2xl",
          isExecutive
            ? "bg-gradient-to-r from-primary via-emerald-500 to-secondary"
            : isBasic
            ? "bg-muted-foreground/40"
            : "bg-accent"
        )}
      />

      <div className="p-6 flex-1 flex flex-col">
        {/* Tier Header & Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                isExecutive
                  ? "bg-primary text-primary-foreground"
                  : isBasic
                  ? "bg-muted text-muted-foreground border border-border"
                  : "bg-secondary/15 text-secondary-foreground border border-secondary/20"
              )}
            >
              {isExecutive ? (
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              ) : isBasic ? (
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-accent" />
              )}
              {plan.tier || "Standard Tier"}
            </span>

            {isDraft && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Draft
              </span>
            )}

            {plan.is_family_eligible && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Family Pass
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">{enrolled}</span>
            <span>enrolled</span>
          </div>
        </div>

        {/* Plan Name & Description */}
        <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-accent transition-colors">
          {plan.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
          {plan.description || "Comprehensive corporate wellness access for employees."}
        </p>

        {/* Key Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Visit Allowance
            </div>
            <div className="text-sm font-bold text-foreground mt-0.5 flex items-baseline gap-1">
              <span>{visits}</span>
              <span className="text-[11px] font-normal text-muted-foreground">visits/mo</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Co-Pay Rule
            </div>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {copay === 0 ? (
                <span className="text-accent">100% Covered</span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">{copay}% Co-Pay</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Budget Cap
            </div>
            <div className="text-xs font-semibold text-foreground mt-0.5 font-mono">
              {budgetCap ? formatRwf(budgetCap) : "Unlimited"}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Est. Monthly
            </div>
            <div className="text-xs font-semibold text-foreground mt-0.5 font-mono">
              {plan.estimated_monthly_liability
                ? formatRwf(plan.estimated_monthly_liability)
                : formatRwf(enrolled * visits * 5000 * (1 - copay / 100))}
            </div>
          </div>
        </div>

        {/* Allowed Categories Tags */}
        <div className="mt-4">
          <div className="text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
            Covered Network Categories
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(plan.allowed_provider_categories || []).map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-card border border-border text-foreground"
              >
                <CheckCircle2 className="w-3 h-3 text-accent" />
                {CATEGORY_LABELS[cat] || cat}
              </span>
            ))}
          </div>
        </div>

        {/* Assigned Departments Preview */}
        {plan.departments && plan.departments.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">Teams:</span>
            <span className="truncate">{plan.departments.join(", ")}</span>
          </div>
        )}

        {/* Collapsible Policy & Subsidy Breakdown Drawer (Native interpolate-size) */}
        <div className="mt-3.5 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`plan-breakdown-${plan.id}`}
            className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span>{isExpanded ? "Hide Policy Breakdown" : "View Policy & Subsidy Breakdown"}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
          </button>

          <div
            id={`plan-breakdown-${plan.id}`}
            className={cn("pf-accordion-content", isExpanded && "is-open")}
            data-state={isExpanded ? "open" : "closed"}
          >
            <div className="pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Employer Subsidy / Visit:</span>
                <span className="font-semibold text-foreground font-mono">
                  {formatRwf(Math.round(5000 * (1 - copay / 100)))}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Employee Co-Pay / Visit:</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400 font-mono">
                  {formatRwf(Math.round(5000 * (copay / 100)))}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Est. 30% Tax Shield:</span>
                <span className="font-semibold text-accent font-mono">
                  {formatRwf(Math.round((enrolled * visits * 5000 * (1 - copay / 100)) * 0.30))}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/60 text-[10px] text-muted-foreground leading-normal mt-1">
                Verified visits only &bull; Anti-passback 20-min cooldown &bull; Auto-synced to monthly RRA EBM invoice
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions Bottom Bar */}
      <div className="p-4 bg-muted/30 border-t border-border rounded-b-2xl flex items-center justify-between gap-2">
        <button
          onClick={() => onAssign(plan)}
          className="flex-1 py-2 px-3 rounded-xl bg-card border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 text-secondary" />
          <span>Assign Roster</span>
        </button>

        <button
          onClick={() => onEdit(plan)}
          className="flex-1 py-2 px-3 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Rules</span>
        </button>
      </div>
    </div>
  );
};
