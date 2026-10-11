"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, Users, ShieldCheck, ArrowRight, Sparkles, Building2, Check } from "lucide-react";
import { useLeadModal } from "@/lib/lead-modal";

interface RoiCalculatorProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function RoiCalculator({ onOpenLeadForm }: RoiCalculatorProps = {}) {
  const openLeadModal = useLeadModal((s) => s.open);
  const [employees, setEmployees] = useState<number>(100);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional' | 'custom'>('professional');
  const [budgetPerEmployee, setBudgetPerEmployee] = useState<number>(29000); // Defaults to Professional (29,000 RWF)

  const handleTierSelect = (tier: 'starter' | 'professional' | 'custom') => {
    setSelectedTier(tier);
    if (tier === 'starter') {
      setBudgetPerEmployee(16000);
    } else if (tier === 'professional') {
      setBudgetPerEmployee(29000);
    }
  };

  // Pure budget projections (No cooked ROI / fake multipliers)
  const monthlyTotalRwf = employees * budgetPerEmployee;
  const annualTotalRwf = monthlyTotalRwf * 12;

  const formatRwf = (num: number) => {
    return `RWF ${new Intl.NumberFormat("en-US").format(num)}`;
  };

  return (
    <section id="roi-calculator" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white text-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/15 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Corporate Budget Planning</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Plan Your Corporate Wellness Allowance
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground mt-3 sm:mt-4 leading-relaxed">
            Estimate your annual corporate fitness investment with clear, transparent pricing based on employee headcount and published plan tiers.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Controls Card */}
          <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-emerald-700">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Budget Inputs</h3>
                  <p className="text-xs text-muted-foreground">Adjust team headcount and select plan tier</p>
                </div>
              </div>

              {/* Tier Preset Selector */}
              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Plan Tier Preset
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleTierSelect('starter')}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left cursor-pointer ${
                      selectedTier === 'starter'
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Starter</span>
                      {selectedTier === 'starter' && <Check className="w-3.5 h-3.5 text-accent" />}
                    </div>
                    <span className="text-[11px] font-normal opacity-90">16,000 RWF/mo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTierSelect('professional')}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left cursor-pointer ${
                      selectedTier === 'professional'
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Professional</span>
                      {selectedTier === 'professional' && <Check className="w-3.5 h-3.5 text-accent" />}
                    </div>
                    <span className="text-[11px] font-normal opacity-90">29,000 RWF/mo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTierSelect('custom')}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left cursor-pointer ${
                      selectedTier === 'custom'
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Custom</span>
                      {selectedTier === 'custom' && <Check className="w-3.5 h-3.5 text-accent" />}
                    </div>
                    <span className="text-[11px] font-normal opacity-90">Flexible</span>
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
                  <span className="text-sm font-bold text-emerald-800 bg-accent/15 px-2.5 py-1 rounded-md">
                    {employees} Employees
                  </span>
                </div>
                <input
                  id="roi-employees-slider"
                  name="roi-employees"
                  aria-label="Employee Headcount Slider"
                  type="range"
                  min="10"
                  max="1000"
                  step="5"
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1 font-medium">
                  <span>10 employees</span>
                  <span>500</span>
                  <span>1,000+ employees</span>
                </div>
              </div>

              {/* Slider 2: Monthly Budget per Employee */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2.5">
                  <label htmlFor="roi-budget-slider" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Monthly Allowance / Employee
                  </label>
                  <span className="text-sm font-bold text-emerald-800 bg-accent/15 px-2.5 py-1 rounded-md">
                    {formatRwf(budgetPerEmployee)} / mo
                  </span>
                </div>
                <input
                  id="roi-budget-slider"
                  name="roi-budget"
                  aria-label="Monthly Allowance per Employee Slider"
                  type="range"
                  min="10000"
                  max="100000"
                  step="1000"
                  value={budgetPerEmployee}
                  onChange={(e) => {
                    setBudgetPerEmployee(Number(e.target.value));
                    setSelectedTier('custom');
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1 font-medium">
                  <span>10,000 RWF (Starter)</span>
                  <span>50,000</span>
                  <span>100,000 RWF (Executive)</span>
                </div>
              </div>
            </div>

            {/* Total Spend Summary Box */}
            <div className="mt-4 bg-slate-50 border border-border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projected Monthly Total</p>
                <p className="text-xl font-extrabold text-foreground">{formatRwf(monthlyTotalRwf)}</p>
              </div>
              <Link 
                href="/pricing"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>Compare Plans</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Results Display Card */}
          <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden border border-white/10">
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Investment Summary
                </span>
                <span className="text-xs font-medium bg-white/10 text-gray-200 px-2.5 py-1 rounded-full">
                  12-Month Projection
                </span>
              </div>

              {/* Metric 1 */}
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-400 mb-1">Total Projected Annual Commitment</p>
                <p className="text-3xl sm:text-4xl font-extrabold text-accent">
                  {formatRwf(annualTotalRwf)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Full network wellness coverage for all {employees} eligible corporate employees.
                </p>
              </div>

              {/* Key Features Breakdown */}
              <div className="space-y-3 border-t border-white/10 pt-6 mb-6">
                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                  <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Single corporate contract with consolidated 18% VAT RRA EBM monthly billing</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                  <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Dynamic TOTP QR check-in tracking across 15+ verified partner locations in Kigali</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                  <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Real-time department utilization telemetry and employee roster administration</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                if (onOpenLeadForm) {
                  onOpenLeadForm('employer');
                } else {
                  openLeadModal('employer');
                }
              }}
              aria-label="Talk to us to receive a custom proposal"
              className="w-full bg-accent hover:bg-accent-hover text-accent-foreground py-4 rounded-xl font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 cursor-pointer active:scale-95"
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
