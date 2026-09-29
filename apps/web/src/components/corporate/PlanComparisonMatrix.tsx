"use client";

import React from "react";
import { Check, X, Crown, Shield, Layers, UserPlus, Edit2 } from "lucide-react";
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
  if (!plans || plans.length === 0) {
    return null;
  }

  const formatRwf = (amt: number) => {
    return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amt) + " RWF";
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0B1F33]">Side-by-Side Tier Matrix</h3>
            <p className="text-xs text-[#526173] mt-0.5">
              Compare benefit entitlements, subsidy splits, and facility access across active corporate plans.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E0F9F5] text-[#007A68] border border-[#B7F1D2]">
            {plans.length} Tiers Active
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-white">
              <th className="py-4 px-6 w-1/4 font-semibold text-[#8491A3] uppercase tracking-wider text-[11px]">
                Benefit Feature
              </th>
              {plans.map((p) => {
                const tier = (p.tier || "standard").toLowerCase();
                const isExecutive = tier === "executive" || tier === "premium";
                return (
                  <th key={p.id} className="py-4 px-6 font-bold text-[#0B1F33] text-sm">
                    <div className="flex items-center gap-2">
                      {isExecutive ? (
                        <Crown className="w-4 h-4 text-[#F59E0B]" />
                      ) : tier === "basic" ? (
                        <Layers className="w-4 h-4 text-[#526173]" />
                      ) : (
                        <Shield className="w-4 h-4 text-[#28D17C]" />
                      )}
                      <span>{p.name}</span>
                    </div>
                    <div className="text-[11px] font-normal text-[#526173] mt-0.5 capitalize">
                      {p.tier || "Standard Tier"}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0]">
            {/* Monthly Visits */}
            <tr className="hover:bg-[#F8FAFC] transition-colors">
              <td className="py-3.5 px-6 font-medium text-[#0B1F33]">Monthly Visit Quota</td>
              {plans.map((p) => (
                <td key={p.id} className="py-3.5 px-6 font-bold text-[#0B1F33]">
                  {p.max_monthly_visits} visits / month
                </td>
              ))}
            </tr>

            {/* Co-Pay Rule */}
            <tr className="hover:bg-[#F8FAFC] transition-colors">
              <td className="py-3.5 px-6 font-medium text-[#0B1F33]">Employee Co-Pay</td>
              {plans.map((p) => {
                const copay = Number(p.co_pay_percentage || 0);
                return (
                  <td key={p.id} className="py-3.5 px-6">
                    {copay === 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9FAF2] text-[#008A4B]">
                        0% (100% Employer Funded)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706]">
                        {copay}% Employee Co-Pay
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Budget Cap */}
            <tr className="hover:bg-[#F8FAFC] transition-colors">
              <td className="py-3.5 px-6 font-medium text-[#0B1F33]">Monthly Budget Cap / Employee</td>
              {plans.map((p) => (
                <td key={p.id} className="py-3.5 px-6 font-mono text-[#0B1F33]">
                  {p.budget_cap_per_employee ? formatRwf(p.budget_cap_per_employee) : "Unlimited Cap"}
                </td>
              ))}
            </tr>

            {/* Family Pass */}
            <tr className="hover:bg-[#F8FAFC] transition-colors">
              <td className="py-3.5 px-6 font-medium text-[#0B1F33]">Family / Dependent Pass</td>
              {plans.map((p) => (
                <td key={p.id} className="py-3.5 px-6">
                  {p.is_family_eligible ? (
                    <span className="inline-flex items-center gap-1 text-[#008A4B] font-semibold">
                      <Check className="w-4 h-4 text-[#28D17C]" /> Included
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#94A3B8]">
                      <X className="w-4 h-4 text-[#CBD5E1]" /> Employee Only
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Provider Categories Rows */}
            {ALL_CATEGORIES.map((cat) => (
              <tr key={cat.key} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-3 px-6 text-[#526173] pl-8 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                  <span>{cat.label}</span>
                </td>
                {plans.map((p) => {
                  const isAllowed = (p.allowed_provider_categories || []).includes(cat.key);
                  return (
                    <td key={p.id} className="py-3 px-6">
                      {isAllowed ? (
                        <div className="w-6 h-6 rounded-full bg-[#E9FAF2] text-[#008A4B] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#F1F4F8] text-[#94A3B8] flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Enrolled Headcount */}
            <tr className="hover:bg-[#F8FAFC] transition-colors bg-[#F8FAFC]/50">
              <td className="py-3.5 px-6 font-medium text-[#0B1F33]">Enrolled Roster</td>
              {plans.map((p) => (
                <td key={p.id} className="py-3.5 px-6 font-bold text-[#0B1F33]">
                  {p.enrolled_count || 0} employees
                </td>
              ))}
            </tr>

            {/* Estimated Cost Per Employee */}
            <tr className="hover:bg-[#F8FAFC] transition-colors bg-[#F8FAFC]/50">
              <td className="py-3.5 px-6 font-medium text-[#0B1F33]">Est. Employer Cost / Member</td>
              {plans.map((p) => {
                const visits = p.max_monthly_visits || 6;
                const copay = Number(p.co_pay_percentage || 0);
                const cost = Math.round(visits * 5000 * (1 - copay / 100));
                return (
                  <td key={p.id} className="py-3.5 px-6 font-bold text-[#0B1F33] font-mono">
                    ~{formatRwf(cost)} / mo
                  </td>
                );
              })}
            </tr>

            {/* Action Row */}
            <tr>
              <td className="py-4 px-6 font-semibold text-[#8491A3]">Actions</td>
              {plans.map((p) => (
                <td key={p.id} className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAssign(p)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#0B1F33] text-[#0B1F33] text-xs font-semibold hover:bg-[#F1F4F8] transition-colors flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3 text-[#007A68]" />
                      <span>Assign</span>
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      className="px-3 py-1.5 rounded-lg bg-[#28D17C] text-[#0B1F33] text-xs font-bold hover:bg-[#22BC6E] transition-colors flex items-center gap-1 shadow-sm"
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
  );
};
