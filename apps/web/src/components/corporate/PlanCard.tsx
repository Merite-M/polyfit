"use client";

import React from "react";
import {
  Crown,
  Shield,
  Layers,
  CheckCircle2,
  Users,
  Calendar,
  Percent,
  Building2,
  Edit2,
  UserPlus
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
        "group relative flex flex-col justify-between rounded-2xl bg-white border transition-all duration-200 hover:shadow-md",
        isExecutive
          ? "border-[#0B1F33]/20 shadow-sm"
          : isDraft
          ? "border-dashed border-[#CBD5E1] bg-[#F8FAFC]"
          : "border-[#E2E8F0]"
      )}
    >
      {/* Top Accent Strip */}
      <div
        className={cn(
          "h-1.5 w-full rounded-t-2xl",
          isExecutive
            ? "bg-gradient-to-r from-[#0B1F33] via-[#10B981] to-[#00D2B4]"
            : isBasic
            ? "bg-[#94A3B8]"
            : "bg-[#28D17C]"
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
                  ? "bg-[#0B1F33] text-white"
                  : isBasic
                  ? "bg-[#F1F4F8] text-[#526173] border border-[#E2E8F0]"
                  : "bg-[#E0F9F5] text-[#007A68] border border-[#B7F1D2]"
              )}
            >
              {isExecutive ? (
                <Crown className="w-3.5 h-3.5 text-[#F59E0B]" />
              ) : isBasic ? (
                <Layers className="w-3.5 h-3.5 text-[#526173]" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-[#28D17C]" />
              )}
              {plan.tier || "Standard Tier"}
            </span>

            {isDraft && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                Draft
              </span>
            )}

            {plan.is_family_eligible && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                Family Pass
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-[#8491A3]">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#0B1F33]">{enrolled}</span>
            <span>enrolled</span>
          </div>
        </div>

        {/* Plan Name & Description */}
        <h3 className="text-lg font-bold text-[#0B1F33] leading-snug group-hover:text-[#008A4B] transition-colors">
          {plan.name}
        </h3>
        <p className="text-xs text-[#526173] mt-1.5 line-clamp-2 leading-relaxed">
          {plan.description || "Comprehensive corporate wellness access for employees."}
        </p>

        {/* Key Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/70">
          <div>
            <div className="text-[11px] font-medium text-[#8491A3] uppercase tracking-wider">
              Visit Allowance
            </div>
            <div className="text-sm font-bold text-[#0B1F33] mt-0.5 flex items-baseline gap-1">
              <span>{visits}</span>
              <span className="text-[11px] font-normal text-[#526173]">visits/mo</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#8491A3] uppercase tracking-wider">
              Co-Pay Rule
            </div>
            <div className="text-sm font-bold text-[#0B1F33] mt-0.5">
              {copay === 0 ? (
                <span className="text-[#008A4B]">100% Covered</span>
              ) : (
                <span className="text-[#D97706]">{copay}% Co-Pay</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#8491A3] uppercase tracking-wider">
              Budget Cap
            </div>
            <div className="text-xs font-semibold text-[#0B1F33] mt-0.5 font-mono">
              {budgetCap ? formatRwf(budgetCap) : "Unlimited"}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#8491A3] uppercase tracking-wider">
              Est. Monthly
            </div>
            <div className="text-xs font-semibold text-[#0B1F33] mt-0.5 font-mono">
              {plan.estimated_monthly_liability
                ? formatRwf(plan.estimated_monthly_liability)
                : formatRwf(enrolled * visits * 5000 * (1 - copay / 100))}
            </div>
          </div>
        </div>

        {/* Allowed Categories Tags */}
        <div className="mt-4">
          <div className="text-[11px] font-medium text-[#8491A3] mb-1.5 uppercase tracking-wider">
            Covered Network Categories
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(plan.allowed_provider_categories || []).map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-[#E2E8F0] text-[#334155]"
              >
                <CheckCircle2 className="w-3 h-3 text-[#28D17C]" />
                {CATEGORY_LABELS[cat] || cat}
              </span>
            ))}
          </div>
        </div>

        {/* Assigned Departments Preview */}
        {plan.departments && plan.departments.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-[#E2E8F0]/70 flex items-center gap-1.5 text-xs text-[#526173]">
            <Building2 className="w-3.5 h-3.5 text-[#8491A3]" />
            <span className="font-medium text-[#0B1F33]">Teams:</span>
            <span className="truncate">{plan.departments.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Card Actions Bottom Bar */}
      <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] rounded-b-2xl flex items-center justify-between gap-2">
        <button
          onClick={() => onAssign(plan)}
          className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#0B1F33] text-[#0B1F33] text-xs font-semibold hover:bg-[#F1F4F8] transition-colors flex items-center justify-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#007A68]" />
          <span>Assign Roster</span>
        </button>

        <button
          onClick={() => onEdit(plan)}
          className="flex-1 py-2 px-3 rounded-xl bg-[#28D17C] text-[#0B1F33] text-xs font-bold hover:bg-[#22BC6E] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Rules</span>
        </button>
      </div>
    </div>
  );
};
