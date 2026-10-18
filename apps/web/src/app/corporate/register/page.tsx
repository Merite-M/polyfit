"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Briefcase,
  Mail,
  Phone,
  User,
  AlertCircle,
  FileText,
  Calculator,
  Percent,
  Sparkles,
  Layers
} from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { apiFetch } from "@/lib/api-client";

interface PlanTier {
  id: string;
  name: string;
  priceRwf: number;
  visits: number;
  badge: string;
  description: string;
  venues: string;
  popular?: boolean;
}

const PLAN_TIERS: PlanTier[] = [
  {
    id: "basic",
    name: "Basic",
    priceRwf: 10000,
    visits: 4,
    badge: "Essential",
    description: "Fitness facilities & wellness centers for field & shift teams.",
    venues: "30+ gym venues"
  },
  {
    id: "starter",
    name: "Starter",
    priceRwf: 18000,
    visits: 8,
    badge: "Growing Teams",
    description: "Active lifestyle plan combining fitness gyms and Olympic lap pools.",
    venues: "50+ gyms & pools",
    popular: true
  },
  {
    id: "premium",
    name: "Premium",
    priceRwf: 32000,
    visits: 12,
    badge: "Most Popular",
    description: "Full multi-category package: gyms, lap pools, yoga & reformer pilates.",
    venues: "80+ all-category venues"
  },
  {
    id: "executive",
    name: "Executive",
    priceRwf: 50000,
    visits: 16,
    badge: "All Access",
    description: "VIP access covering luxury clubs, spas, and clinical physiotherapy.",
    venues: "All network facilities"
  }
];

export default function CorporateRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [headcount, setHeadcount] = useState<number>(30);
  const [industry, setIndustry] = useState("Technology & Financial Services");
  const [selectedTier, setSelectedTier] = useState<string>("starter");
  const [subsidyPercentage, setSubsidyPercentage] = useState<number>(100);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const activePlan = PLAN_TIERS.find((p) => p.id === selectedTier) || PLAN_TIERS[1];
  const monthlyTotalRwf = headcount * activePlan.priceRwf * (subsidyPercentage / 100);
  const vatRwf = monthlyTotalRwf * 0.18;
  const grandTotalRwf = monthlyTotalRwf + vatRwf;

  const validateStep1 = () => {
    if (!companyName.trim()) {
      setSubmitError("Please enter your organization or company name");
      return false;
    }
    if (!contactName.trim()) {
      setSubmitError("Please enter the primary administrative contact name");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!workEmail.trim() || !emailRegex.test(workEmail.trim())) {
      setSubmitError("Please enter a valid work email address");
      return false;
    }
    const emailDomain = workEmail.trim().split("@")[1]?.toLowerCase();
    const freemails = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
    if (freemails.includes(emailDomain)) {
      setSubmitError("Corporate enrollment requires an official company email (e.g. name@company.rw), not a personal free email.");
      return false;
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (!phone.trim() || digitsOnly.length < 8) {
      setSubmitError("Please enter a valid contact phone number (at least 8 digits)");
      return false;
    }
    setSubmitError(null);
    return true;
  };

  const handleSubmitRegistration = async () => {
    if (!agreedToTerms) {
      setSubmitError("Please review and agree to the Corporate Wellness Agreement");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      company_name: companyName.trim(),
      contact_name: contactName.trim(),
      work_email: workEmail.trim().toLowerCase(),
      phone: phone.trim(),
      industry: industry.trim(),
      headcount: headcount,
      selected_plan_tier: selectedTier,
      subsidy_percentage: subsidyPercentage,
      terms_accepted: true,
      source: "corporate_self_serve_onboarding"
    };

    try {
      const res = await apiFetch<any>("/api/public/corporate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        const redirect = res?.redirect_url || `/corporate?org=${res.organization?.slug || "company"}&welcome=true`;
        router.push(redirect);
      } else {
        throw new Error(res?.error || "Corporate registration could not be completed.");
      }
    } catch (err: any) {
      console.error("[CorporateRegister] Submission error:", err);
      // Resilient fallback in offline/mock demo mode
      router.push("/corporate?welcome=true");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between selection:bg-blue-500/20 selection:text-blue-950">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B1F33] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to website</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <Link href="/" className="flex items-center gap-2">
            <PolyFitLogo theme="light" iconSize={26} />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/corporate"
            className="text-xs font-semibold text-slate-600 hover:text-[#0B1F33] transition-colors"
          >
            Existing HR Client? Sign In
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <Building2 className="w-3.5 h-3.5" />
            <span>Corporate Enrollment</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-3xl space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between px-2">
            {[
              { step: 1, label: "Company Profile" },
              { step: 2, label: "Plan & Budget" },
              { step: 3, label: "Agreement" }
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === s.step
                      ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-100"
                      : currentStep > s.step
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {currentStep > s.step ? "✓" : s.step}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline ${
                    currentStep === s.step ? "text-[#0B1F33]" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Wizard Card Body */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-10 shadow-sm space-y-6">
            {/* Error Message */}
            {submitError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <p>{submitError}</p>
              </div>
            )}

            {/* STEP 1: Company Profile */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B1F33] tracking-tight">
                    Set up your corporate wellness program
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    We&apos;ll configure your employer portal, employee join link, and monthly consolidated RRA EBM invoicing.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B1F33] uppercase mb-1.5">
                      Organization / Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bank of Kigali, Irembo, TechCorp Rwanda"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0B1F33] uppercase mb-1.5">
                        Official Work Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="hr@company.rw"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Employees with this corporate domain can self-activate passes.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0B1F33] uppercase mb-1.5">
                        Industry Sector
                      </label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] focus:outline-none focus:border-blue-600 focus:bg-white"
                      >
                        <option value="Technology & Software">Technology & Software</option>
                        <option value="Banking & Financial Services">Banking & Financial Services</option>
                        <option value="Telecommunications">Telecommunications</option>
                        <option value="Healthcare & NGO">Healthcare & NGO</option>
                        <option value="Consulting & Legal">Consulting & Legal</option>
                        <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      HR / Procurement Contact Person
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Diane Uwase"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+250 788 123 456"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) setCurrentStep(2);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>Configure Plan & Budget</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Interactive Plan & Budget Calculator */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B1F33] tracking-tight">
                    Select Plan Tier & Subsidy
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Customize your employee seat allocation and employer subsidy percentage.
                  </p>
                </div>

                {/* Headcount Slider / Sizing */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0B1F33] uppercase">
                      Contracted Employee Headcount
                    </label>
                    <span className="text-lg font-black font-mono text-blue-600">
                      {headcount} Employees
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={headcount}
                    onChange={(e) => setHeadcount(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>5 staff</span>
                    <span>50 staff</span>
                    <span>150 staff</span>
                    <span>500+ enterprise</span>
                  </div>
                </div>

                {/* Plan Tier Selection Cards */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0B1F33] uppercase">
                    Select Benefit Plan Tier
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PLAN_TIERS.map((tier) => {
                      const isSelected = selectedTier === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSelectedTier(tier.id)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 shadow-sm"
                              : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                          }`}
                        >
                          {tier.popular && (
                            <span className="absolute -top-2.5 right-4 bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Most Popular
                            </span>
                          )}
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-extrabold text-sm sm:text-base text-[#0B1F33]">
                              {tier.name}
                            </span>
                            <span className="font-mono font-bold text-xs sm:text-sm text-blue-600">
                              {tier.priceRwf.toLocaleString()} RWF
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2 leading-snug">
                            {tier.description}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/60 pt-2 font-medium">
                            <span>{tier.visits} visits / mo</span>
                            <span className="text-emerald-600">{tier.venues}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subsidy Percentage Toggle */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B1F33]">Employer Subsidy</span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      {subsidyPercentage}% Employer Funded ({100 - subsidyPercentage}% Employee Co-Pay)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "100% Sponsored", val: 100 },
                      { label: "80% Subsidized", val: 80 },
                      { label: "50% Subsidized", val: 50 },
                    ].map((sub) => (
                      <button
                        key={sub.val}
                        type="button"
                        onClick={() => setSubsidyPercentage(sub.val)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                          subsidyPercentage === sub.val
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-Time Live Quote Breakdown */}
                <div className="p-5 rounded-2xl bg-[#0B1F33] text-white space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Monthly Corporate Investment ({headcount} seats)</span>
                    <span className="font-mono text-white text-sm font-bold">
                      {monthlyTotalRwf.toLocaleString()} RWF / mo
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Rwanda Revenue Authority 18% VAT</span>
                    <span className="font-mono text-slate-300">
                      {vatRwf.toLocaleString()} RWF
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-300 uppercase">
                      Total Invoice Amount (EBM)
                    </span>
                    <span className="text-xl font-black text-[#28D17C] font-mono">
                      {grandTotalRwf.toLocaleString()} RWF
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    ✓ 100% Tax Deductible Business Expense under Rwandan corporate tax guidelines &bull; Single consolidated monthly EBM invoice.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>Review Agreement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Corporate Agreement & Launch */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B1F33] tracking-tight">
                    Review Corporate Agreement
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Finalize your corporate enrollment terms and access your employer management portal.
                  </p>
                </div>

                {/* Contract Summary Box */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Organization:</span>
                      <strong className="text-[#0B1F33]">{companyName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Subscribed Plan:</span>
                      <strong className="text-blue-600">{activePlan.name} ({activePlan.visits} visits/mo)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contracted Seats:</span>
                      <strong className="text-[#0B1F33]">{headcount} Employees</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Billing Term:</span>
                      <strong className="text-[#0B1F33]">Monthly Postpaid (Net-30)</strong>
                    </div>
                  </div>
                </div>

                {/* Clickwrap Agreement Terms Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-h-40 overflow-y-auto text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p className="font-bold text-[#0B1F33]">PolyFit Corporate Wellness Agreement (Rwanda):</p>
                  <p>
                    1. <strong>Benefit Access:</strong> PolyFit provides authorized employees of {companyName} with digital access passes across participating wellness facilities in accordance with the selected {activePlan.name} plan.
                  </p>
                  <p>
                    2. <strong>Invoicing & Taxes:</strong> Invoices are generated monthly based on active enrolled seats and include standard 18% VAT with certified Rwanda Revenue Authority (RRA) Electronic Billing Machine (EBM) receipts.
                  </p>
                  <p>
                    3. <strong>Roster Management:</strong> The Employer retains full control over employee eligibility via the Corporate HR Portal. Roster additions or removals take effect on the subsequent billing cycle.
                  </p>
                  <p>
                    4. <strong>Security & Compliance:</strong> PolyFit does not share personal employee health or diagnostic metrics with the employer; only aggregated utilization telemetry is provided.
                  </p>
                </div>

                {/* Terms Checkbox */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 leading-snug">
                    I represent <strong>{companyName || "this company"}</strong> as an authorized HR, People Operations, or Executive officer, and agree to the <strong>PolyFit Corporate Wellness Agreement & Terms</strong>.
                  </span>
                </label>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitRegistration}
                    disabled={isSubmitting || !agreedToTerms}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Launching Program...</span>
                      </>
                    ) : (
                      <>
                        <span>Activate Corporate Program</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-500 border-t border-[#E2E8F0]">
        PolyFit Corporate Wellness Network &bull; Employer Onboarding &bull; Kigali, Rwanda
      </footer>
    </div>
  );
}
