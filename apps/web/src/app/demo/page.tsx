"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Receipt, 
  ArrowRight,
  Clock,
  Send,
  HelpCircle
} from "lucide-react";
import PublicNavigation from "@/components/public-navigation";
import Footer from "@/components/landing/footer";
import { supabase } from "@polyfit/supabase-client";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    work_email: "",
    phone: "",
    country: "Rwanda",
    company_size: "50-200",
    interest_tier: "Professional",
    message: "",
    consent: true,
    website_url_hp: "", // Anti-spam honeypot
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      errors.company_name = "Company or organization name is required";
    }
    if (!formData.contact_name.trim() || formData.contact_name.trim().length < 2) {
      errors.contact_name = "Please enter your full name";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.work_email.trim() || !emailRegex.test(formData.work_email.trim())) {
      errors.work_email = "Please enter a valid work email address";
    }
    const digits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim() || digits.length < 8) {
      errors.phone = "Please enter a valid phone number (at least 8 digits)";
    }
    if (!formData.company_size) {
      errors.company_size = "Please select your staff headcount";
    }
    if (!formData.consent) {
      errors.consent = "You must agree to the corporate privacy terms";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    // Anti-spam honeypot silent reject
    if (formData.website_url_hp) {
      setIsSuccess(true);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      company_name: formData.company_name.trim(),
      contact_name: formData.contact_name.trim(),
      work_email: formData.work_email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      country: formData.country.trim(),
      company_size: formData.company_size,
      interest_tier: formData.interest_tier,
      message: formData.message.trim() || null,
      source: "website_demo_page",
      status: "pending",
    };

    try {
      let saved = false;

      // 1. Try Direct Supabase Insert
      try {
        const { error: sbError } = await supabase.from("demo_requests").insert(payload);
        if (!sbError) {
          saved = true;
        } else {
          console.warn("[DemoPage] Supabase insert warning:", sbError);
        }
      } catch (err) {
        console.warn("[DemoPage] Supabase error:", err);
      }

      // 2. Mirror to Backend API if primary insert didn't confirm or for server email triggers
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      try {
        const res = await fetch(`${backendUrl}/api/public/demo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          saved = true;
        }
      } catch (apiErr) {
        console.warn("[DemoPage] Backend API call warning:", apiErr);
      }

      if (saved) {
        setIsSuccess(true);
      } else {
        throw new Error("Unable to save your request at this moment. Please email corporate@polyfit.rw directly.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F33] selection:bg-[#28D17C]/20 selection:text-[#0B1F33]">
      <PublicNavigation />

      <main id="main-content" className="pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8FBF1] text-[#0E6245] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#28D17C]" />
              <span>Schedule Corporate Demo & ROI Briefing</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33]">
              Request an Itemized Wellness Proposal
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[#64748B]">
              Connect with our enterprise team for a 15-minute briefing on employer pricing, RRA EBM invoicing, and network activation for your staff.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Form Column (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-10 shadow-sm">
              {isSuccess ? (
                <div className="text-center py-10 px-4">
                  <div className="w-16 h-16 rounded-full bg-[#E8FBF1] text-[#28D17C] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F33] mb-3">
                    Demo Request Received!
                  </h2>
                  <p className="text-sm sm:text-base text-[#64748B] max-w-md mx-auto leading-relaxed mb-8">
                    Thank you, <strong>{formData.contact_name}</strong>. Our enterprise team is preparing a customized proposal for <strong>{formData.company_name}</strong>. We will reach out within 24 hours.
                  </p>

                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-6 text-left max-w-md mx-auto mb-8 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      What Happens Next:
                    </div>
                    <div className="flex items-start gap-3 text-xs sm:text-sm text-[#0B1F33]">
                      <div className="w-5 h-5 rounded-full bg-[#0B1F33] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</div>
                      <span>We review your office locations and calculate vetted facility density.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs sm:text-sm text-[#0B1F33]">
                      <div className="w-5 h-5 rounded-full bg-[#0B1F33] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</div>
                      <span>We provide an RRA EBM 18% VAT compliant corporate cost model.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs sm:text-sm text-[#0B1F33]">
                      <div className="w-5 h-5 rounded-full bg-[#0B1F33] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</div>
                      <span>Launch a 90-day pilot with automated digital pass roster activation.</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/pricing"
                      className="px-6 py-3 bg-[#0B1F33] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-[10px] transition-colors"
                    >
                      Explore Plan Tiers
                    </Link>
                    <Link
                      href="/#facility-directory"
                      className="px-6 py-3 bg-[#F1F5F9] hover:bg-slate-200 text-[#0B1F33] text-xs sm:text-sm font-semibold rounded-[10px] transition-colors"
                    >
                      Browse Partner Facilities
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-[10px] flex items-center gap-3 text-xs sm:text-sm text-red-700">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Honeypot anti-spam field (hidden) */}
                  <input
                    type="text"
                    name="website_url_hp"
                    value={formData.website_url_hp}
                    onChange={(e) => setFormData({ ...formData, website_url_hp: e.target.value })}
                    style={{ display: "none" }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* Organization & Contact Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F33] mb-1.5">
                        Company / Organization <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="e.g. Bank of Kigali, Equity Bank"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          className={`w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-xs sm:text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#28D17C] transition-all ${
                            fieldErrors.company_name ? "border-red-400" : "border-[#CBD5E1]"
                          }`}
                        />
                      </div>
                      {fieldErrors.company_name && (
                        <p className="text-[11px] text-red-600 mt-1">{fieldErrors.company_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F33] mb-1.5">
                        Contact Person Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alice Uwase"
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        className={`w-full px-3.5 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-xs sm:text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#28D17C] transition-all ${
                          fieldErrors.contact_name ? "border-red-400" : "border-[#CBD5E1]"
                        }`}
                      />
                      {fieldErrors.contact_name && (
                        <p className="text-[11px] text-red-600 mt-1">{fieldErrors.contact_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Work Email & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F33] mb-1.5">
                        Work Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="alice@company.rw"
                          value={formData.work_email}
                          onChange={(e) => setFormData({ ...formData, work_email: e.target.value })}
                          className={`w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-xs sm:text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#28D17C] transition-all ${
                            fieldErrors.work_email ? "border-red-400" : "border-[#CBD5E1]"
                          }`}
                        />
                      </div>
                      {fieldErrors.work_email && (
                        <p className="text-[11px] text-red-600 mt-1">{fieldErrors.work_email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F33] mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="+250 788 123 456"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={`w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-xs sm:text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#28D17C] transition-all ${
                            fieldErrors.phone ? "border-red-400" : "border-[#CBD5E1]"
                          }`}
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="text-[11px] text-red-600 mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Country & Company Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F33] mb-1.5">
                        Headquarters Country <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] text-xs sm:text-sm text-[#0B1F33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#28D17C] transition-all"
                        >
                          <option value="Rwanda">Rwanda</option>
                          <option value="Kenya">Kenya</option>
                          <option value="Uganda">Uganda</option>
                          <option value="Tanzania">Tanzania</option>
                          <option value="Regional / Other">Regional East Africa / Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F33] mb-1.5">
                        Company Employee Size <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={formData.company_size}
                          onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] text-xs sm:text-sm text-[#0B1F33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#28D17C] transition-all"
                        >
                          <option value="10-50">10 – 50 employees (Starter)</option>
                          <option value="50-200">50 – 200 employees (Professional)</option>
                          <option value="200-500">200 – 500 employees (Professional Plus)</option>
                          <option value="500+">500+ employees (Enterprise Custom)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Plan Interest Tier Radio */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F33] mb-2">
                      Primary Plan Tier Interest
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Starter", "Professional", "Enterprise"].map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setFormData({ ...formData, interest_tier: tier })}
                          className={`py-2 px-3 rounded-[8px] text-xs font-semibold border transition-all text-center ${
                            formData.interest_tier === tier
                              ? "bg-[#0B1F33] text-white border-[#0B1F33] shadow-xs"
                              : "bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] hover:text-[#0B1F33]"
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message / Goals */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F33] mb-1.5">
                      Specific Facilities or Requirements (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Need coverage for branches in Kigali and Musanze. Looking to launch a 90-day pilot for 150 staff."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] text-xs sm:text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#28D17C] transition-all"
                    />
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="consent-checkbox"
                      checked={formData.consent}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded text-[#28D17C] focus:ring-[#28D17C] border-gray-300"
                    />
                    <label htmlFor="consent-checkbox" className="text-xs text-[#64748B] leading-relaxed">
                      I agree to the processing of corporate contact information for demo scheduling under Rwandan Law No 058/2021 on Data Protection and PolyFit&apos;s{" "}
                      <Link href="/privacy" className="text-[#0B1F33] underline font-semibold">
                        Privacy Policy
                      </Link>.
                    </label>
                  </div>
                  {fieldErrors.consent && (
                    <p className="text-[11px] text-red-600">{fieldErrors.consent}</p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 bg-[#28D17C] hover:bg-[#22C55E] text-[#0B1F33] text-sm font-bold rounded-[10px] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-[#28D17C]/20 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Corporate Demo Request</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Social Proof & Value Strip Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Value Guarantee Card */}
              <div className="bg-[#0B1F33] text-white rounded-[16px] p-6 sm:p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#28D17C]/10 rounded-full blur-2xl pointer-events-none" />
                
                <h3 className="text-lg font-bold text-white mb-4">
                  Why East African Leaders Choose PolyFit
                </h3>

                <div className="space-y-4 text-xs sm:text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#28D17C]/20 text-[#28D17C] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-white block">One Consolidated RRA EBM Invoice</strong>
                      Replace dozens of scattered gym receipts with a single 18% VAT itemized statement.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#28D17C]/20 text-[#28D17C] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-white block">Anti-Passback Hardware Security</strong>
                      Time-expiring QR passes prevent fraud and pass sharing among unauthorized third parties.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#28D17C]/20 text-[#28D17C] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-white block">50+ Vetted Multi-Category Venues</strong>
                      Gyms, lap pools, pilates studios, and spas in Kigali, Musanze, and Rubavu.
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                  <span>90-Day Flexible Pilot Option</span>
                  <span className="text-[#28D17C] font-semibold">Zero Equipment Costs</span>
                </div>
              </div>

              {/* Direct Advisory Contact */}
              <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm">
                <h4 className="text-sm font-bold text-[#0B1F33] mb-1">
                  Prefer a Direct Conversation?
                </h4>
                <p className="text-xs text-[#64748B] mb-4">
                  Speak directly with a senior corporate benefits specialist in Kigali.
                </p>

                <div className="space-y-2.5 text-xs text-[#0B1F33]">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#28D17C]" />
                    <a href="mailto:corporate@polyfit.rw" className="font-semibold hover:underline">
                      corporate@polyfit.rw
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#28D17C]" />
                    <span className="font-semibold">+250 (0) 788 000 000</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#64748B]">
                    <Clock className="w-4 h-4 text-[#94A3B8]" />
                    <span>Monday – Friday, 8:00 AM – 6:00 PM CAT</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
