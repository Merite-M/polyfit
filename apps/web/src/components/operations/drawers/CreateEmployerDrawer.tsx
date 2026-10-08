"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Building2,
  Percent,
  Mail,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  DollarSign,
  Users,
  Briefcase,
  Globe,
  Sliders,
  Send,
  Loader2
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface CreateEmployerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClient: any) => void;
}

const INDUSTRY_OPTIONS = [
  "Banking & Financial Services",
  "Technology & Software",
  "Telecommunications",
  "Healthcare & Pharma",
  "Manufacturing & FMCG",
  "NGO & International Development",
  "Public Sector & Government",
  "Professional Services & Consulting"
];

const HEADCOUNT_TIERS = [
  { id: "1-50", label: "1 - 50 employees", seats: 35 },
  { id: "51-250", label: "51 - 250 employees", seats: 120 },
  { id: "251-1000", label: "251 - 1,000 employees", seats: 450 },
  { id: "1000+", label: "1,000+ Enterprise", seats: 1200 }
];

const PLAN_TIER_BENCHMARKS: Record<string, { label: string; monthlyCost: number; visits: number }> = {
  starter: { label: "Starter", monthlyCost: 20000, visits: 8 },
  standard: { label: "Standard (Most Popular)", monthlyCost: 45000, visits: 12 },
  premium: { label: "Premium All-Access", monthlyCost: 75000, visits: 16 },
  executive: { label: "Executive VIP", monthlyCost: 120000, visits: 24 }
};

export function CreateEmployerDrawer({
  isOpen,
  onClose,
  onSuccess
}: CreateEmployerDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Corporate Identity & Tax TIN
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRY_OPTIONS[0]);
  const [country, setCountry] = useState("Rwanda");
  const [taxId, setTaxId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [headcountTier, setHeadcountTier] = useState("51-250");

  // Step 2: Commercial Terms & Subsidy Matrix
  const [contractedSeats, setContractedSeats] = useState(120);
  const [planTier, setPlanTier] = useState("standard");
  const [subsidyModel, setSubsidyModel] = useState<"100_percent" | "percentage" | "fixed_allowance">("percentage");
  const [coPayPercentage, setCoPayPercentage] = useState(30); // 30% employee, 70% employer
  const [budgetCap, setBudgetCap] = useState<number | "">(35000);
  const [maxMonthlyVisits, setMaxMonthlyVisits] = useState(12);

  // Step 3: Domain Whitelisting & Initial HR Admin Invite
  const [domainInput, setDomainInput] = useState("");
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Synchronize native <dialog> lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      // Reset form state on close
      setCurrentStep(1);
      setError(null);
    }
  }, [isOpen]);

  // Keep admin email in sync with contact email if not edited
  useEffect(() => {
    if (contactEmail && !adminEmail) {
      setAdminEmail(contactEmail);
    }
  }, [contactEmail, adminEmail]);

  // Auto-suggest domain based on contact email
  useEffect(() => {
    if (contactEmail && contactEmail.includes("@") && allowedDomains.length === 0) {
      const extractedDomain = contactEmail.split("@")[1]?.toLowerCase().trim();
      if (extractedDomain && !["gmail.com", "yahoo.com", "outlook.com"].includes(extractedDomain)) {
        setAllowedDomains([extractedDomain]);
      }
    }
  }, [contactEmail, allowedDomains.length]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleAddDomain = () => {
    const clean = domainInput.replace(/^@/, "").trim().toLowerCase();
    if (clean && !allowedDomains.includes(clean)) {
      setAllowedDomains((prev) => [...prev, clean]);
      setDomainInput("");
    }
  };

  const handleRemoveDomain = (d: string) => {
    setAllowedDomains((prev) => prev.filter((item) => item !== d));
  };

  const handleKeyDownDomain = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddDomain();
    }
  };

  // Live Economics Calculation
  const benchmarkCost = PLAN_TIER_BENCHMARKS[planTier]?.monthlyCost || 45000;
  let employerShare = 0;
  let employeeShare = 0;

  if (subsidyModel === "100_percent") {
    employerShare = benchmarkCost;
    employeeShare = 0;
  } else if (subsidyModel === "percentage") {
    employeeShare = Math.round(benchmarkCost * (coPayPercentage / 100));
    employerShare = benchmarkCost - employeeShare;
  } else {
    // fixed_allowance
    const cap = typeof budgetCap === "number" ? budgetCap : 35000;
    employerShare = Math.min(benchmarkCost, cap);
    employeeShare = Math.max(0, benchmarkCost - employerShare);
  }

  const projectedMonthlyEmployerCommitment = employerShare * contractedSeats;

  // Submission handler
  const handleProvisionClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company Legal Name is required.");
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        industry,
        country,
        tax_id: taxId.trim() || null,
        contact_email: contactEmail.trim() || null,
        billing_email: billingEmail.trim() || null,
        headcount_tier: headcountTier,
        contracted_seats: contractedSeats,
        allowed_domains: allowedDomains,
        subsidy_model: subsidyModel,
        co_pay_percentage: subsidyModel === "percentage" ? coPayPercentage : 0,
        budget_cap_per_employee: subsidyModel === "fixed_allowance" && typeof budgetCap === "number" ? budgetCap : null,
        max_monthly_visits: maxMonthlyVisits,
        plan_tier: planTier,
        admin_name: adminName.trim() || null,
        admin_email: adminEmail.trim() || null
      };

      const res = await apiFetch<any>("/api/operations/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res && res.organization) {
        onSuccess(res.organization);
        onClose();
      }
    } catch (err: any) {
      console.error("[CreateEmployerDrawer] Provision error:", err);
      setError(err?.message || "Failed to provision corporate client. Please verify fields and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 p-0 w-full h-full max-w-none max-h-none bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-xs z-50 flex justify-end"
    >
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 bg-[#0B1F33] text-white flex items-center justify-between border-b border-[#21405A]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30">
                <Building2 className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight">Provision Corporate Client</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#28D17C]/20 text-[#28D17C] font-semibold">
                PF-118
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Streamlined 3-step enterprise client contract & subsidy onboarding
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="px-6 py-3 bg-[#071521] border-b border-[#21405A] flex items-center justify-between text-xs">
          {[
            { step: 1, title: "1. Corporate Identity & TIN" },
            { step: 2, title: "2. Subsidy Matrix Builder" },
            { step: 3, title: "3. Domain Gatekeeping" }
          ].map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${
                    isCompleted
                      ? "bg-[#28D17C] text-[#0B1F33]"
                      : isCurrent
                      ? "bg-white text-[#0B1F33] ring-2 ring-[#28D17C]"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                </div>
                <span
                  className={`font-medium text-[11px] hidden sm:inline ${
                    isCurrent ? "text-white font-semibold" : "text-slate-400"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleProvisionClient} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Corporate Identity & Tax TIN */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Step 1: Legal Entity & Identity</h3>
                  <p className="text-xs text-slate-500">
                    Establish official commercial identity and revenue authority tax registration.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Company Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bank of Kigali Plc, I&M Bank Rwanda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Industry Sector</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                    >
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Country Jurisdiction</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                    >
                      <option value="Rwanda">Rwanda (RWF)</option>
                      <option value="Kenya">Kenya (KES)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Tax Identification Number (TIN / RRA / KRA)</span>
                    <span className="text-[10px] text-slate-400">Required for B2B electronic VAT invoices</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100029381 (9 digits)"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Total Workforce Headcount Tier</label>
                  <div className="grid grid-cols-2 gap-2">
                    {HEADCOUNT_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => {
                          setHeadcountTier(tier.id);
                          setContractedSeats(tier.seats);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          headcountTier === tier.id
                            ? "border-[#28D17C] bg-[#28D17C]/10 text-slate-900 font-semibold"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <div className="text-xs">{tier.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Suggested contracted: {tier.seats} seats
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Primary HR / People Lead Email</label>
                    <input
                      type="email"
                      placeholder="hr.director@company.rw"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Finance & Billing Email</label>
                    <input
                      type="email"
                      placeholder="finance@company.rw"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Commercial Terms & Subsidy Matrix Builder */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Step 2: Commercial Contract & Subsidy Matrix</h3>
                  <p className="text-xs text-slate-500">
                    Configure employer co-payment splits and contracted beneficiary access caps.
                  </p>
                </div>

                {/* Contracted Seats */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">Contracted Employee Seats Cap</span>
                      <p className="text-[11px] text-slate-500">
                        PolyFit alerts operations when beneficiary enrollment reaches 90%.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <Users className="w-4 h-4 text-[#28D17C]" />
                      <span>{contractedSeats} seats</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={2000}
                    step={10}
                    value={contractedSeats}
                    onChange={(e) => setContractedSeats(Number(e.target.value))}
                    className="w-full accent-[#28D17C] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>10 seats</span>
                    <span>500 seats</span>
                    <span>1,000 seats</span>
                    <span>2,000+ seats</span>
                  </div>
                </div>

                {/* Multi-Tier Benefit Plan Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Initial Contract Tier</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(PLAN_TIER_BENCHMARKS).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPlanTier(key)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          planTier === key
                            ? "border-[#28D17C] bg-[#28D17C]/10 text-slate-900 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <div className="font-semibold text-xs text-slate-900">{val.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          RWF {val.monthlyCost.toLocaleString()} / mo · {val.visits} visits/mo
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subsidy Model Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Corporate Subsidy Model</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "100_percent", label: "Model A", desc: "100% Employer Funded" },
                      { id: "percentage", label: "Model B", desc: "Percentage Co-Payment" },
                      { id: "fixed_allowance", label: "Model C", desc: "Fixed RWF Allowance" }
                    ].map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setSubsidyModel(model.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          subsidyModel === model.id
                            ? "border-[#28D17C] bg-[#28D17C]/10 text-slate-900 font-semibold shadow-xs"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <div className="text-[10px] font-mono text-[#28D17C] uppercase font-bold">{model.label}</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{model.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subsidies Slider (For Model B) */}
                {subsidyModel === "percentage" && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">Co-Payment Allocation Ratio</span>
                      <span className="font-mono font-bold text-[#0B1F33]">
                        Employer {100 - coPayPercentage}% / Employee {coPayPercentage}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={coPayPercentage}
                      onChange={(e) => setCoPayPercentage(Number(e.target.value))}
                      className="w-full accent-[#28D17C] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>100% Employer Funded</span>
                      <span>50/50 Equal Split</span>
                      <span>20% Employer / 80% Employee</span>
                    </div>
                  </div>
                )}

                {/* Allowance Cap (For Model C) */}
                {subsidyModel === "fixed_allowance" && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <label className="text-xs font-semibold text-slate-800">
                      Monthly Employer Allowance Cap per Employee
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">RWF</span>
                      <input
                        type="number"
                        step={5000}
                        value={budgetCap}
                        onChange={(e) => setBudgetCap(e.target.value === "" ? "" : Number(e.target.value))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Employer pays up to this amount; beneficiary pays any remaining delta.
                    </p>
                  </div>
                )}

                {/* VISUAL ECONOMICS CALCULATOR CARD */}
                <div className="p-4 rounded-xl bg-[#0B1F33] text-white space-y-3 border border-[#21405A]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#28D17C]" />
                      <span className="text-xs font-bold tracking-wide">Live Subsidy Economics Preview</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#00D2B4] uppercase">
                      {PLAN_TIER_BENCHMARKS[planTier]?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 rounded-lg bg-[#142C44] border border-[#21405A]">
                      <div className="text-[10px] text-slate-400 font-medium">Employer Contribution</div>
                      <div className="text-sm font-mono font-bold text-[#28D17C] mt-0.5">
                        RWF {employerShare.toLocaleString()}
                        <span className="text-[10px] font-normal text-slate-400"> / employee</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#142C44] border border-[#21405A]">
                      <div className="text-[10px] text-slate-400 font-medium">Employee Co-Pay</div>
                      <div className="text-sm font-mono font-bold text-white mt-0.5">
                        RWF {employeeShare.toLocaleString()}
                        <span className="text-[10px] font-normal text-slate-400"> / employee</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#21405A] flex items-center justify-between text-xs">
                    <span className="text-slate-300 text-[11px]">
                      Projected Total Monthly Client Commitment ({contractedSeats} seats):
                    </span>
                    <span className="font-mono font-bold text-[#00D2B4] text-xs">
                      RWF {projectedMonthlyEmployerCommitment.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Domain Whitelisting & Initial HR Admin Invite */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Step 3: Domain Whitelist & Initial HR Admin</h3>
                  <p className="text-xs text-slate-500">
                    Automate mobile onboarding via corporate email domains and dispatch admin portal credentials.
                  </p>
                </div>

                {/* Whitelisted Email Domains Gatekeeping */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Whitelisted Corporate Email Domains</span>
                    <span className="text-[10px] text-[#28D17C] font-semibold">Auto-Match Gatekeeping</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Employees registering with these email domains on PolyFit mobile app will automatically verify and
                    gain access to this employer&apos;s subsidy policy.
                  </p>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs font-mono">
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. bk.rw, bankofkigali.rw"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        onKeyDown={handleKeyDownDomain}
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDomain}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
                    >
                      Add Domain
                    </button>
                  </div>

                  {/* Domain Tag Chips */}
                  <div className="flex flex-wrap gap-2 pt-1 min-h-[36px]">
                    {allowedDomains.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">
                        No domains whitelisted yet. Enter domain above and click Add.
                      </span>
                    ) : (
                      allowedDomains.map((domain) => (
                        <span
                          key={domain}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-medium"
                        >
                          <span>@{domain}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDomain(domain)}
                            className="text-emerald-600 hover:text-emerald-900 transition-colors"
                            aria-label={`Remove domain ${domain}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Initial HR Admin Invite */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <Send className="w-4 h-4 text-[#28D17C]" />
                    <span>Initial Employer HR Admin Invite</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Dispatches a secure invitation magic link allowing the client&apos;s HR lead to access the
                    PolyFit Corporate Portal (`/corporate`).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Admin Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Marie Claire Mukamana"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Admin Corporate Email</label>
                      <input
                        type="email"
                        placeholder="hr.lead@company.rw"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                      />
                    </div>
                  </div>
                </div>

                {/* Provision Summary Card */}
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800">Ready to provision:</div>
                  <ul className="text-slate-600 space-y-1 text-[11px] list-disc list-inside">
                    <li>Client Name: <strong className="text-slate-900">{name || "—"}</strong> ({industry})</li>
                    <li>Capacity: <strong className="text-slate-900">{contractedSeats} seats</strong> on {PLAN_TIER_BENCHMARKS[planTier]?.label}</li>
                    <li>Subsidy Matrix: <strong className="text-slate-900">{subsidyModel === "100_percent" ? "100% Employer" : `Employer ${100 - coPayPercentage}% / Employee ${coPayPercentage}%`}</strong></li>
                    <li>Gatekeeping: <strong className="text-slate-900">{allowedDomains.length} domains</strong> whitelisted</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !name.trim()) {
                    setError("Please enter the company legal name before proceeding.");
                    return;
                  }
                  setError(null);
                  setCurrentStep((prev) => (prev + 1) as any);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#28D17C] hover:bg-[#22b76c] text-[#0B1F33] text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning Client...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Provision Client & Activate Matrix</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </dialog>
  );
}
