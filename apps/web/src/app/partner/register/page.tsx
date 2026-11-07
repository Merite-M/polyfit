"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dumbbell,
  Building2,
  MapPin,
  Mail,
  Clock,
  Phone,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  FileText,
  AlertCircle,
  Sparkles,
  Waves,
  Flame,
  Activity,
  HeartPulse,
  Award,
  Layers,
  Banknote,
  Smartphone,
  Plus,
  Trophy,
  Coffee,
  Zap,
  Droplets,
  Car,
  Lock,
  Wifi,
  ScanLine
} from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { apiFetch } from "@/lib/api-client";

interface ActivityOption {
  id: string;
  name: string;
  icon: any;
  category: string;
}

const RWANDA_ACTIVITIES: ActivityOption[] = [
  { id: "gym", name: "Gym Floor & Free Weights (Eleiko Barbells, Squat Racks, Dumbbells)", icon: Dumbbell, category: "Strength & Fitness" },
  { id: "functional", name: "HIIT & Functional Turf Circuits (Sleds, Rowers, AirBikes)", icon: Activity, category: "Conditioning" },
  { id: "pool", name: "25m Semi-Olympic Heated Lap Pool & Towels", icon: Waves, category: "Aquatics" },
  { id: "sauna", name: "Finnish Dry Sauna & Eucalyptus Steam Room", icon: Flame, category: "Thermal Wellness" },
  { id: "cold_plunge", name: "Ice Bath & Cold Plunge Tub", icon: Waves, category: "Thermal Wellness" },
  { id: "yoga", name: "Yoga & Reformer Pilates (Mats & Props)", icon: Sparkles, category: "Mind & Body" },
  { id: "aerobics", name: "Group Aerobics & Afro-Beats Dance Fitness", icon: Layers, category: "Group Fitness" },
  { id: "spinning", name: "Indoor Cycling & Spinning Studio", icon: Activity, category: "Cardio" },
  { id: "tennis_padel", name: "Clay Tennis & Padel Courts (Floodlit)", icon: Trophy, category: "Racquet Sports" },
  { id: "combat", name: "Boxing & Combat Sports Heavy Bags", icon: Award, category: "Combat" },
  { id: "physio", name: "Sports Physiotherapy & Recovery Clinic", icon: HeartPulse, category: "Clinical Recovery" },
  { id: "generator", name: "24/7 Backup Generator (Zero Outage Guarantee)", icon: Zap, category: "Facility Infrastructure" },
  { id: "water_reserve", name: "Dedicated Water Reserves & Solar Hot Showers", icon: Droplets, category: "Facility Infrastructure" },
  { id: "parking", name: "Guarded Secure Parking with 24/7 Security", icon: Car, category: "Hospitality & Access" },
  { id: "lockers", name: "Digital Lockers & Private Dressing Suites", icon: Lock, category: "Hospitality & Access" },
  { id: "wifi", name: "High-Speed Fiber Wi-Fi", icon: Wifi, category: "Connectivity" },
  { id: "inbody", name: "InBody Bioimpedance Health Scan", icon: ScanLine, category: "Health & Assessment" },
  { id: "cafe", name: "Protein Shake & Rwandan Specialty Coffee Bar", icon: Coffee, category: "Hospitality" },
];

const RWANDA_DISTRICTS = [
  "Gasabo - Kimihurura",
  "Gasabo - Nyarutarama",
  "Gasabo - Gisozi",
  "Kicukiro - Niboye",
  "Kicukiro - Gikondo",
  "Nyarugenge - Kiyovu",
  "Nyarugenge - Downtown",
  "Musanze - Northern Province",
  "Rubavu - Lake Kivu",
  "Huye - Southern Province"
];

function PartnerRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStatus = searchParams?.get("status");
  const queryEmail = searchParams?.get("email");

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isSubmitted, setIsSubmitted] = useState<boolean>(queryStatus === "submitted");
  const [submittedEmail, setSubmittedEmail] = useState<string>(queryEmail || "");
  const [submittedName, setSubmittedName] = useState<string>("");

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [location, setLocation] = useState("Gasabo - Kimihurura");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [facilityCount, setFacilityCount] = useState("1");
  const [selectedActivities, setSelectedActivities] = useState<string[]>(["gym"]);
  const [standardRackRate, setStandardRackRate] = useState("45000");
  const [payoutMethod, setPayoutMethod] = useState<"bank" | "momo">("bank");
  const [bankName, setBankName] = useState("Bank of Kigali");
  const [accountNumber, setAccountNumber] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [customActivity, setCustomActivity] = useState("");

  const toggleActivity = (id: string) => {
    setSelectedActivities((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((a) => a !== id)
          : prev
        : [...prev, id]
    );
  };

  const handleAddCustomActivity = () => {
    if (!customActivity.trim()) return;
    const clean = customActivity.trim();
    if (!selectedActivities.includes(clean)) {
      setSelectedActivities((prev) => [...prev, clean]);
    }
    setCustomActivity("");
  };

  const validateStep1 = () => {
    if (!businessName.trim()) {
      setSubmitError("Please enter your facility name");
      return false;
    }
    if (!contactName.trim()) {
      setSubmitError("Please enter the contact person's name");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim() || !emailRegex.test(contactEmail.trim())) {
      setSubmitError("Please enter a valid business email");
      return false;
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (!phone.trim() || digitsOnly.length < 8) {
      setSubmitError("Please enter a valid phone number (at least 8 digits)");
      return false;
    }
    setSubmitError(null);
    return true;
  };

  const handleSubmitRegistration = async () => {
    if (!agreedToTerms) {
      setSubmitError("Please review and agree to the partnership agreement");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      business_name: businessName.trim(),
      legal_name: legalName.trim() || businessName.trim(),
      contact_name: contactName.trim(),
      contact_email: contactEmail.trim().toLowerCase(),
      phone: phone.trim(),
      location: location.trim(),
      categories: selectedActivities,
      facility_count: facilityCount,
      standard_rack_rate_rwf: Number(standardRackRate) || 45000,
      payout_method: payoutMethod,
      bank_name: payoutMethod === "bank" ? bankName : undefined,
      account_number: payoutMethod === "bank" ? accountNumber.trim() : undefined,
      momo_number: payoutMethod === "momo" ? (momoNumber.trim() || phone.trim()) : undefined,
      terms_accepted: true,
      source: "partner_self_onboarding_wizard"
    };

    try {
      const res = await apiFetch<any>("/api/public/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        if (typeof window !== "undefined") {
          try {
            if (res.provider) {
              localStorage.setItem("polyfit_partner_provider", JSON.stringify(res.provider));
            }
            if (res.location?.id) {
              localStorage.setItem("polyfit_partner_location_id", res.location.id);
            }
            if (res.location) {
              localStorage.setItem("polyfit_partner_location", JSON.stringify(res.location));
            }
            localStorage.setItem("polyfit_partner_registered_amenities", JSON.stringify(selectedActivities));
          } catch (e) {
            console.warn("[PartnerRegister] Storage notice:", e);
          }
        }
        setIsSubmitted(true);
        setSubmittedName(businessName.trim());
        setSubmittedEmail(contactEmail.trim().toLowerCase());
        router.push(`/partner/register?status=submitted&email=${encodeURIComponent(contactEmail.trim().toLowerCase())}`);
      } else {
        throw new Error(res?.error || "Registration could not be completed.");
      }
    } catch (err: any) {
      console.error("[PartnerRegister] Submission error:", err);
      setSubmitError(err.message || "Failed to submit facility application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render High-Trust Operations Review Screen when submitted
  if (isSubmitted || queryStatus === "submitted") {
    const displayEmail = submittedEmail || queryEmail || contactEmail;
    const displayName = submittedName || businessName || "Your Wellness Facility";

    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between selection:bg-[#28D17C]/20 selection:text-[#0B1F33]">
        <header className="h-16 px-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 z-20">
          <Link href="/" className="flex items-center gap-2">
            <PolyFitLogo theme="light" iconSize={26} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/partner/login?email=${encodeURIComponent(displayEmail)}`}
              className="text-xs font-semibold text-slate-600 hover:text-[#0B1F33] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold tracking-wide uppercase border border-emerald-200">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Review SLA: 24 Hours Max</span>
                </div>
                <h1 className="text-2xl font-bold text-[#0B1F33] tracking-tight">
                  Application Submitted for Review
                </h1>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for submitting <strong className="text-slate-900">{displayName}</strong> to the PolyFit Corporate Wellness Network. Your facility details and commercial payout rails have been queued for Operations review.
                </p>
              </div>

              {/* Progress Stepper */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">1. Facility Profile & Payout Rails Submitted</h4>
                    <p className="text-[11px] text-slate-500">Facility amenities, commercial expectations, and banking info recorded.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 animate-pulse">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">2. Operations Review & KYC Verification</h4>
                    <p className="text-[11px] text-slate-600">PolyFit Operations is reviewing compliance. Committed turnaround is <strong className="text-slate-900">within 24 hours max</strong>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">3. Activation Link & Credential Formulation</h4>
                    <p className="text-[11px] text-slate-500">
                      Upon approval, your secure activation link will be dispatched to <span className="font-mono text-slate-800">{displayEmail}</span> and via WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Link
                  href={`/partner/login?email=${encodeURIComponent(displayEmail)}`}
                  className="w-full py-3 px-4 bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>Check Application Status on Partner Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/network"
                  className="block text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Explore the PolyFit Provider Network Directory &rarr;
                </Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-4 px-6 text-center text-xs text-slate-500 border-t border-[#E2E8F0]">
          PolyFit Corporate Wellness Network &bull; Provider Verification &bull; Kigali, Rwanda
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between selection:bg-indigo-500/20 selection:text-indigo-950">
      {/* Top Simple Header */}
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
            href="/partner"
            className="text-xs font-semibold text-slate-600 hover:text-[#0B1F33] transition-colors"
          >
            Already a Partner? Sign In
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Provider Network</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-2xl space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between px-2">
            {[
              { step: 1, label: "Facility Info" },
              { step: 2, label: "Activities" },
              { step: 3, label: "Pricing & Payouts" },
              { step: 4, label: "Agreement" }
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === s.step
                      ? "bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-100"
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

          {/* Card Body */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-10 shadow-sm space-y-6">
            {/* Error Banner */}
            {submitError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <p>{submitError}</p>
              </div>
            )}

            {/* STEP 1: Facility Profile */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B1F33] tracking-tight">
                    Tell us about your wellness facility
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    We&apos;ll use this information to create your partner profile and display your venue to corporate employees.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B1F33] uppercase mb-1.5">
                      Facility Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kigali Strength & Performance"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0B1F33] uppercase mb-1.5">
                        District / City <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] focus:outline-none focus:border-indigo-600 focus:bg-white"
                      >
                        {RWANDA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0B1F33] uppercase mb-1.5">
                        Number of Locations
                      </label>
                      <select
                        value={facilityCount}
                        onChange={(e) => setFacilityCount(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] focus:outline-none focus:border-indigo-600 focus:bg-white"
                      >
                        <option value="1">1 Standalone Facility</option>
                        <option value="2-3">2 - 3 Locations</option>
                        <option value="4+">4+ Regional Facilities</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Authorized Contact Person
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Patrick Habimana"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                            Contact Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="manager@gym.rw"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                            Phone / WhatsApp <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+250 788 000 000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                          />
                        </div>
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
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>Continue to Activities</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Activities & Categories (Tailored to Rwanda/East Africa) */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B1F33] tracking-tight">
                    Select your facility activities
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Select the activities and amenities available at your venue. We match these to corporate benefit categories.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RWANDA_ACTIVITIES.map((act) => {
                    const isSelected = selectedActivities.includes(act.id);
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => toggleActivity(act.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                            : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-slate-500 border border-slate-200"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs sm:text-sm text-[#0B1F33]">
                              {act.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {act.category}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom unlisted activity or service input */}
                <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B1F33]">
                      Offering other wellness or sports services?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Add any unlisted specialty
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Ice Plunge, Padel Clinics, Recovery Saunas..."
                      value={customActivity}
                      onChange={(e) => setCustomActivity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomActivity();
                        }
                      }}
                      className="flex-1 px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0B1F33] placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomActivity}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Selected <strong>{selectedActivities.length}</strong> activity category(s). You can fine-tune specific equipment and rules in the partner setup wizard.
                  </span>
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
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>Continue to Pricing & Payouts</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Rack Rates & Payout Setup */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B1F33] tracking-tight">
                    Rack rate & Settlement account
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Tell us your standard retail membership fee so we place you in the optimal employer tier.
                  </p>
                </div>

                {/* Rack Rate Input */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-[#0B1F33] uppercase">
                    Standard Retail Monthly Membership Rate (RWF)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-sm font-bold text-slate-400 font-mono">
                      RWF
                    </span>
                    <input
                      type="number"
                      step="5000"
                      value={standardRackRate}
                      onChange={(e) => setStandardRackRate(e.target.value)}
                      placeholder="45000"
                      className="w-full pl-16 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-base font-bold text-[#0B1F33] focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    What a walk-in private member pays per month for unlimited access at your facility.
                  </p>
                </div>

                {/* Settlement Method */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#0B1F33] uppercase">
                    Preferred Payout Settlement Channel
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod("bank")}
                      className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                        payoutMethod === "bank"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-900"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-indigo-600" />
                      <div className="text-xs font-bold">Bank Transfer (EFT)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutMethod("momo")}
                      className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                        payoutMethod === "momo"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-900"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-indigo-600" />
                      <div className="text-xs font-bold">MTN Mobile Money</div>
                    </button>
                  </div>

                  {payoutMethod === "bank" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                          Bank Name
                        </label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-xs text-[#0B1F33] focus:outline-none focus:border-indigo-600"
                        >
                          <option value="Bank of Kigali">Bank of Kigali (BK)</option>
                          <option value="Equity Bank Rwanda">Equity Bank Rwanda</option>
                          <option value="I&M Bank Rwanda">I&M Bank Rwanda</option>
                          <option value="BPR Bank Rwanda">BPR Bank Rwanda</option>
                          <option value="Cogebanque">Cogebanque</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 00040-0692841-29"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-xs text-[#0B1F33] focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                        Registered MTN MoMo Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+250 788 123 456"
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-xl text-xs text-[#0B1F33] focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>Review Agreement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Commercial Contract & Clickwrap Agreement */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B1F33] tracking-tight">
                    Partner Commercial Agreement
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Transparent, guaranteed terms designed to maximize corporate visits to your facility with zero hassle.
                  </p>
                </div>

                {/* Terms Breakdown Card */}
                <div className="p-5 rounded-2xl bg-[#0B1F33] text-white space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400 font-medium">Reimbursement Payout</span>
                    <span className="text-lg font-black text-[#28D17C] font-mono">
                      5,000 RWF / verified visit
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Settlement Schedule:</span>
                      <strong className="text-white">Net-15 Automated Cycle</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Front Desk Policy:</span>
                      <strong className="text-[#28D17C]">Zero Cash Collection</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Check-in Modality:</span>
                      <strong className="text-white">QR Dynamic App Pass / PIN</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Software Access:</span>
                      <strong className="text-white">Free Front-Desk Desk App</strong>
                    </div>
                  </div>
                </div>

                {/* Clickwrap Agreement Terms Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-h-40 overflow-y-auto text-xs text-slate-600 space-y-2 leading-relaxed font-sans">
                  <p className="font-bold text-[#0B1F33]">Standard Partner Network Terms & Conditions (Rwanda):</p>
                  <p>
                    1. <strong>Verification:</strong> The Partner agrees to admit active corporate beneficiaries who present a valid, non-expired PolyFit dynamic pass or QR badge.
                  </p>
                  <p>
                    2. <strong>Settlement:</strong> PolyFit guarantees payout of 5,000 RWF per authenticated check-in. Settlements are calculated monthly and disbursed within fifteen (15) calendar days (Net-15).
                  </p>
                  <p>
                    3. <strong>Zero Cash Collection:</strong> Beneficiaries are subsidized through their employer agreements. The Partner shall never charge walk-in cash co-pays directly to the employee at reception.
                  </p>
                  <p>
                    4. <strong>Independent Operations:</strong> The Partner retains full control over facility hygiene, security, opening hours, and premises rules.
                  </p>
                </div>

                {/* Acceptance Checkbox */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 leading-snug">
                    I represent <strong>{businessName || "this facility"}</strong> and confirm that I have read and agree to the <strong>PolyFit Partner Agreement & Terms of Service</strong>.
                  </span>
                </label>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitRegistration}
                    disabled={isSubmitting || !agreedToTerms}
                    className="px-6 py-3.5 bg-[#0B1F33] hover:bg-[#132D43] text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting for Review...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit for Operations Review (24h SLA)</span>
                        <ArrowRight className="w-4 h-4 text-[#28D17C]" />
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
        PolyFit Corporate Wellness Network &bull; Provider Onboarding &bull; Kigali, Rwanda
      </footer>
    </div>
  );
}

export default function PartnerRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#28D17C] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PartnerRegistrationContent />
    </Suspense>
  );
}

