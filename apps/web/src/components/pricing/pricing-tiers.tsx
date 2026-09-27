"use client";

import { useState } from "react";
import { Check, Sparkles, Building2, ShieldCheck, Zap, ArrowRight } from "lucide-react";

interface PricingTiersProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function PricingTiers({ onOpenLeadForm }: PricingTiersProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [currency, setCurrency] = useState<'RWF' | 'USD'>('RWF');

  const tiers = [
    {
      id: "starter",
      name: "Starter",
      badge: "Growing Teams",
      description: "Essential wellness benefit for emerging companies and boutique offices seeking vetted fitness access.",
      target: "Up to 50 employees",
      pricing: {
        RWF: {
          monthly: 16000,
          annual: 13600,
          period: "/ employee / mo",
        },
        USD: {
          monthly: 13,
          annual: 11,
          period: "/ employee / mo",
        },
      },
      popular: false,
      ctaText: "Start Starter Plan",
      ctaVariant: "secondary",
      features: [
        "Up to 50 active beneficiaries",
        "Access to Core Network (25+ vetted gyms)",
        "Single consolidated RRA EBM monthly invoice",
        "Dynamic anti-passback mobile web passes",
        "Monthly aggregated utilization report (PDF/CSV)",
        "Standard employee roster upload (CSV)",
        "Email support (24h SLA)",
      ],
      notIncluded: [
        "Multi-category access (pools, yoga studios)",
        "Real-time live check-in telemetry",
        "Dedicated Customer Success Manager",
        "Custom provider network additions",
      ],
    },
    {
      id: "professional",
      name: "Professional",
      badge: "Most Popular",
      description: "Comprehensive corporate wellness infrastructure for established companies driving employee retention and health ROI.",
      target: "50 to 500 employees",
      pricing: {
        RWF: {
          monthly: 29000,
          annual: 24650,
          period: "/ employee / mo",
        },
        USD: {
          monthly: 24,
          annual: 20,
          period: "/ employee / mo",
        },
      },
      popular: true,
      ctaText: "Request Professional Pilot",
      ctaVariant: "primary",
      features: [
        "Up to 500 active beneficiaries",
        "Full Multi-Category Network (50+ venues)",
        "Gyms, Olympic Pools, Yoga, Pilates & Studios",
        "Automated RRA EBM 18% VAT compliant invoicing",
        "Instant Anti-Passback biometric & geo lock",
        "Live check-in telemetry & department heatmaps",
        "Bulk CSV & automated employee onboarding",
        "Priority support via WhatsApp & Email (4h SLA)",
        "Quarterly corporate wellness impact review",
      ],
      notIncluded: [
        "Custom provider contract commissioning",
        "Direct HRIS / API webhook sync",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      badge: "Full Customization",
      description: "Tailored multi-facility wellness network with bespoke contract terms, dedicated venue onboarding, and HRIS integration.",
      target: "500+ employees / Multi-country",
      pricing: {
        RWF: {
          monthly: "Custom",
          annual: "Custom",
          period: "volume tiered pricing",
        },
        USD: {
          monthly: "Custom",
          annual: "Custom",
          period: "volume tiered pricing",
        },
      },
      popular: false,
      ctaText: "Contact Enterprise Sales",
      ctaVariant: "enterprise",
      features: [
        "Unlimited beneficiaries & multi-country roaming",
        "Full network + custom venue commissioning on demand",
        "Bespoke billing terms (Net 30/60, quarterly PO)",
        "Direct HRIS API integration (BambooHR, Workday, SAP)",
        "Single Sign-On (SAML / Okta / Azure AD)",
        "Role-based executive administrative controls",
        "Dedicated Enterprise Account Manager & onsite days",
        "99.9% uptime SLA with 1-hour urgent incident response",
        "Full audit trail & settlement compliance documentation",
      ],
      notIncluded: [],
    },
  ];

  const formatPrice = (tierPrice: any) => {
    if (tierPrice[billingCycle] === "Custom") return "Custom";
    if (currency === "RWF") {
      return `RWF ${new Intl.NumberFormat("en-US").format(tierPrice[billingCycle])}`;
    }
    return `$${tierPrice[billingCycle]}`;
  };

  return (
    <section className="py-12 sm:py-16 bg-[#F8FAFC]" aria-labelledby="pricing-tiers-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toggles Container */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
          {/* Currency Toggle */}
          <div className="inline-flex items-center p-1 bg-white border border-[#E2E8F0] rounded-[12px] shadow-xs">
            <button
              type="button"
              onClick={() => setCurrency("RWF")}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[8px] transition-all ${
                currency === "RWF"
                  ? "bg-[#0B1F33] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0B1F33]"
              }`}
              aria-pressed={currency === "RWF"}
            >
              RWF (Rwanda Francs)
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[8px] transition-all ${
                currency === "USD"
                  ? "bg-[#0B1F33] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0B1F33]"
              }`}
              aria-pressed={currency === "USD"}
            >
              USD ($)
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 bg-white border border-[#E2E8F0] rounded-[12px] shadow-xs">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[8px] transition-all ${
                billingCycle === "monthly"
                  ? "bg-[#0B1F33] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0B1F33]"
              }`}
              aria-pressed={billingCycle === "monthly"}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[8px] transition-all ${
                billingCycle === "annual"
                  ? "bg-[#0B1F33] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0B1F33]"
              }`}
              aria-pressed={billingCycle === "annual"}
            >
              <span>Annual Billing</span>
              <span className="bg-[#28D17C] text-[#0B1F33] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => {
            const priceDisplay = formatPrice(tier.pricing[currency]);
            const isCustom = priceDisplay === "Custom";

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between bg-white rounded-[14px] p-6 sm:p-8 transition-all duration-200 ${
                  tier.popular
                    ? "border-2 border-[#28D17C] shadow-xl shadow-[#28D17C]/10 lg:-translate-y-2 z-10"
                    : "border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-slate-300"
                }`}
              >
                {/* Popular Ribbon */}
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#28D17C] text-[#0B1F33] text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Most Popular Choice</span>
                  </div>
                )}

                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-[#0B1F33] tracking-tight">{tier.name}</h3>
                    <span className="text-[11px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-[6px]">
                      {tier.badge}
                    </span>
                  </div>

                  <p className="text-sm text-[#64748B] min-h-[40px] mb-6 leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Target Employee Size */}
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[#0B1F33] bg-[#E8FBF1] text-[#0E6245] px-3 py-1.5 rounded-[8px] mb-6">
                    <Building2 className="w-3.5 h-3.5 text-[#28D17C]" />
                    <span>Target: <strong>{tier.target}</strong></span>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-[#F1F5F9]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33] font-mono tracking-tight">
                        {priceDisplay}
                      </span>
                      {!isCustom && (
                        <span className="text-xs text-[#64748B] font-medium">
                          {tier.pricing[currency].period}
                        </span>
                      )}
                    </div>
                    {billingCycle === "annual" && !isCustom && (
                      <p className="text-xs text-[#28D17C] font-semibold mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Billed annually with 15% corporate savings
                      </p>
                    )}
                    {isCustom && (
                      <p className="text-xs text-[#64748B] mt-1">
                        Volume discounts & dedicated partner facility agreements
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Plan Includes:
                    </p>
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#0B1F33]">
                        <div className="w-4 h-4 rounded-full bg-[#E8FBF1] text-[#28D17C] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}

                    {tier.notIncluded.length > 0 && (
                      <div className="pt-2 space-y-2 opacity-50">
                        {tier.notIncluded.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-[#94A3B8]">
                            <span className="w-4 text-center font-mono text-xs">—</span>
                            <span className="line-through">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card CTA */}
                <div>
                  <button
                    type="button"
                    onClick={() => onOpenLeadForm?.('employer')}
                    className={`w-full py-3.5 px-6 rounded-[10px] text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                      tier.popular
                        ? "bg-[#28D17C] hover:bg-[#22C55E] text-[#0B1F33] shadow-md hover:shadow-lg hover:shadow-[#28D17C]/20"
                        : tier.id === "enterprise"
                        ? "bg-[#0B1F33] hover:bg-slate-800 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-[#0B1F33]"
                    }`}
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-center text-[#94A3B8] mt-2.5">
                    {tier.id === "enterprise" ? "Custom enterprise SLA" : "Includes full RRA EBM tax compliance"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 bg-white border border-[#E2E8F0] rounded-[14px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E8FBF1] text-[#28D17C] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#0B1F33]">
                100% Tax Compliant & Fully Vetted Network
              </h4>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Every subscription includes single consolidated RRA EBM 18% VAT invoicing, real-time anti-passback biometric security, and dedicated settlement for all partner facilities.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenLeadForm?.('employer')}
            className="whitespace-nowrap px-6 py-2.5 bg-[#0B1F33] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-[10px] transition-colors"
          >
            Schedule 15-Min Briefing
          </button>
        </div>
      </div>
    </section>
  );
}
