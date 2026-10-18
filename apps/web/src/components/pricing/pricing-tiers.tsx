"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, Building2, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { useLeadModal } from "@/lib/lead-modal";
import { apiFetch } from "@/lib/api-client";

interface PricingTiersProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function PricingTiers({ onOpenLeadForm }: PricingTiersProps = {}) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [currency, setCurrency] = useState<'RWF' | 'USD'>('RWF');
  const openModal = useLeadModal((s) => s.open);

  const handleOpenLead = (type: 'employer' | 'provider' = 'employer') => {
    if (onOpenLeadForm) {
      onOpenLeadForm(type);
    } else {
      openModal(type);
    }
  };

  const [pricingData, setPricingData] = useState<any>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await apiFetch<any>('/api/public/platform-config');
        if (config?.pricing) {
          setPricingData(config.pricing);
        }
      } catch {
        // Resilient fallback to canonical values
      }
    }
    loadConfig();
  }, []);

  const getTierFromData = (id: string) => {
    if (Array.isArray(pricingData)) {
      return pricingData.find((t: any) => t.id === id || t.tier === id);
    }
    return pricingData?.[id];
  };

  const basicData = getTierFromData("basic");
  const starterData = getTierFromData("starter");
  const premiumData = getTierFromData("premium");
  const execData = getTierFromData("executive");

  const basicRwfMonthly = basicData?.pricing?.RWF?.monthly || basicData?.monthly_price_rwf || 10000;
  const basicRwfAnnual = basicData?.pricing?.RWF?.annual || basicData?.annual_price_rwf || Math.round(basicRwfMonthly * 0.85);
  const basicUsdMonthly = basicData?.pricing?.USD?.monthly || basicData?.monthly_price_usd || 8;
  const basicUsdAnnual = basicData?.pricing?.USD?.annual || basicData?.annual_price_usd || Math.round(basicUsdMonthly * 0.85);

  const starterRwfMonthly = starterData?.pricing?.RWF?.monthly || starterData?.monthly_price_rwf || 18000;
  const starterRwfAnnual = starterData?.pricing?.RWF?.annual || starterData?.annual_price_rwf || Math.round(starterRwfMonthly * 0.85);
  const starterUsdMonthly = starterData?.pricing?.USD?.monthly || starterData?.monthly_price_usd || 14;
  const starterUsdAnnual = starterData?.pricing?.USD?.annual || starterData?.annual_price_usd || Math.round(starterUsdMonthly * 0.85);

  const premiumRwfMonthly = premiumData?.pricing?.RWF?.monthly || premiumData?.monthly_price_rwf || 32000;
  const premiumRwfAnnual = premiumData?.pricing?.RWF?.annual || premiumData?.annual_price_rwf || Math.round(premiumRwfMonthly * 0.85);
  const premiumUsdMonthly = premiumData?.pricing?.USD?.monthly || premiumData?.monthly_price_usd || 24;
  const premiumUsdAnnual = premiumData?.pricing?.USD?.annual || premiumData?.annual_price_usd || Math.round(premiumUsdMonthly * 0.85);

  const execRwfMonthly = execData?.pricing?.RWF?.monthly || execData?.monthly_price_rwf || 50000;
  const execRwfAnnual = execData?.pricing?.RWF?.annual || execData?.annual_price_rwf || Math.round(execRwfMonthly * 0.85);
  const execUsdMonthly = execData?.pricing?.USD?.monthly || execData?.monthly_price_usd || 38;
  const execUsdAnnual = execData?.pricing?.USD?.annual || execData?.annual_price_usd || Math.round(execUsdMonthly * 0.85);

  const tiers = [
    {
      id: "basic",
      tier: "basic",
      name: basicData?.name || "Basic",
      badge: basicData?.badge || "Essential",
      description: basicData?.description || "Essential fitness benefit for shift and operations teams covering vetted fitness & wellness facilities.",
      target: basicData?.target || "Field & shift teams",
      visits: basicData?.visits || 4,
      pricing: {
        RWF: {
          monthly: basicRwfMonthly,
          annual: basicRwfAnnual,
          period: "/ employee / mo",
        },
        USD: {
          monthly: basicUsdMonthly,
          annual: basicUsdAnnual,
          period: "/ employee / mo",
        },
      },
      popular: false,
      ctaText: "Start Basic Plan",
      ctaVariant: "secondary",
      features: basicData?.features || [
        "4 verified visits per month",
        "Access to 30+ vetted fitness & wellness facilities",
        "Single consolidated RRA EBM monthly invoice",
        "Dynamic anti-passback mobile web passes",
        "Monthly aggregated utilization report (PDF/CSV)",
        "Standard employee roster upload (CSV)",
        "Email support (24h SLA)",
      ],
      notIncluded: basicData?.notIncluded || [
        "Olympic pools & aquatic access",
        "Yoga & Reformer Pilates studios",
        "Thermal spas & clinical physiotherapy",
      ],
    },
    {
      id: "starter",
      tier: "starter",
      name: starterData?.name || "Starter",
      badge: starterData?.badge || "Growing Teams",
      description: starterData?.description || "Active lifestyle wellness benefit combining fitness facilities and Olympic lap swimming pools.",
      target: starterData?.target || "Up to 50 employees",
      visits: starterData?.visits || 8,
      pricing: {
        RWF: {
          monthly: starterRwfMonthly,
          annual: starterRwfAnnual,
          period: "/ employee / mo",
        },
        USD: {
          monthly: starterUsdMonthly,
          annual: starterUsdAnnual,
          period: "/ employee / mo",
        },
      },
      popular: false,
      ctaText: "Start Starter Plan",
      ctaVariant: "secondary",
      features: starterData?.features || [
        "8 verified visits per month",
        "Access to 50+ network facilities & Olympic lap pools",
        "Single consolidated RRA EBM monthly invoice",
        "Dual check-in modality (turnstile QR & desk plaque)",
        "Live department utilization telemetry",
        "Standard employee roster upload (CSV)",
        "Priority support (12h SLA)",
      ],
      notIncluded: starterData?.notIncluded || [
        "Yoga & Reformer Pilates studios",
        "Thermal spas & clinical physiotherapy",
      ],
    },
    {
      id: "premium",
      tier: "premium",
      name: premiumData?.name || "Premium",
      badge: premiumData?.badge || "Most Popular",
      description: premiumData?.description || "Comprehensive corporate wellness infrastructure covering fitness facilities, Olympic pools, hot yoga & reformer pilates.",
      target: premiumData?.target || "50 to 500 employees",
      visits: premiumData?.visits || 12,
      pricing: {
        RWF: {
          monthly: premiumRwfMonthly,
          annual: premiumRwfAnnual,
          period: "/ employee / mo",
        },
        USD: {
          monthly: premiumUsdMonthly,
          annual: premiumUsdAnnual,
          period: "/ employee / mo",
        },
      },
      popular: true,
      ctaText: "Request Premium Pilot",
      ctaVariant: "primary",
      features: premiumData?.features || [
        "12 verified visits per month",
        "Full Multi-Category Network (80+ venues)",
        "Fitness Facilities, Olympic Pools, Yoga, Pilates & Studios",
        "Automated RRA EBM 18% VAT compliant invoicing",
        "Instant Anti-Passback biometric & geo lock",
        "Live check-in telemetry & department heatmaps",
        "Bulk CSV & automated employee onboarding",
        "Priority support via WhatsApp & Email (4h SLA)",
        "Quarterly corporate wellness impact review",
      ],
      notIncluded: premiumData?.notIncluded || [
        "Thermal spas & clinical physiotherapy",
      ],
    },
    {
      id: "executive",
      tier: "executive",
      name: execData?.name || "Executive",
      badge: execData?.badge || "All Access",
      description: execData?.description || "All-inclusive executive benefit with unrestricted access to fitness clubs, luxury pools, boutique studios, thermal spas & physiotherapy.",
      target: execData?.target || "Leadership & VIP cohorts",
      visits: execData?.visits || 16,
      pricing: {
        RWF: {
          monthly: execRwfMonthly,
          annual: execRwfAnnual,
          period: "/ employee / mo",
        },
        USD: {
          monthly: execUsdMonthly,
          annual: execUsdAnnual,
          period: "/ employee / mo",
        },
      },
      popular: false,
      ctaText: "Contact Executive Sales",
      ctaVariant: "secondary",
      features: execData?.features || [
        "16 verified visits per month",
        "Unrestricted all-category access across entire network",
        "Fitness Facilities, Olympic Pools, Reformer Pilates, Physio Clinics & Spas",
        "Zero employee co-pay baseline option",
        "Dedicated PolyFit VIP wellness concierge",
        "Custom corporate wellness challenges & executive reviews",
        "Direct HRIS integration & automated webhook sync",
        "Full tax audit trail & RRA EBM certificate",
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
    <section className="py-12 sm:py-16 bg-background" aria-labelledby="pricing-tiers-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toggles Container */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
          {/* Currency Toggle */}
          <div className="inline-flex items-center p-1 bg-card border border-border rounded-[12px] shadow-xs">
            <button
              type="button"
              onClick={() => setCurrency("RWF")}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[8px] transition-all cursor-pointer ${
                currency === "RWF"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={currency === "RWF"}
            >
              RWF (Rwanda Francs)
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[8px] transition-all cursor-pointer ${
                currency === "USD"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={currency === "USD"}
            >
              USD ($)
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 bg-card border border-border rounded-[12px] shadow-xs">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[8px] transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={billingCycle === "monthly"}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[8px] transition-all cursor-pointer ${
                billingCycle === "annual"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={billingCycle === "annual"}
            >
              <span>Annual Billing</span>
              <span className="bg-accent text-accent-foreground text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Container Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {tiers.map((tier) => {
            const priceDisplay = formatPrice(tier.pricing[currency]);
            const isCustom = priceDisplay === "Custom";

            return (
              <div
                key={tier.id}
                className="pf-pricing-card-container"
              >
                <div
                  className={`pf-pricing-card-inner relative h-full flex flex-col justify-between bg-card text-card-foreground rounded-[14px] p-6 sm:p-8 transition-all duration-200 ${
                    tier.popular
                      ? "border-2 border-accent shadow-xl shadow-accent/10 lg:-translate-y-2 z-10"
                      : "border border-border shadow-sm hover:shadow-md hover:border-border/80"
                  }`}
                >
                  {/* Popular Ribbon */}
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Most Popular Choice</span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="pf-fluid-heading font-bold text-foreground tracking-tight">{tier.name}</h3>
                      <span className="pf-fluid-badge font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-[6px]">
                        {tier.badge}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground min-h-[40px] mb-6 leading-relaxed">
                      {tier.description}
                    </p>

                    {/* Target Employee Size */}
                    <div className="inline-flex items-center gap-2 text-xs font-medium bg-accent-subtle text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-[8px] mb-6 border border-accent/20">
                      <Building2 className="w-3.5 h-3.5 text-accent" />
                      <span>Target: <strong>{tier.target}</strong></span>
                    </div>

                    {/* Price */}
                    <div className="mb-6 pb-6 border-b border-border">
                      <div className="flex items-baseline gap-2">
                        <span className="pf-fluid-price font-extrabold text-foreground font-mono tracking-tight">
                          {priceDisplay}
                        </span>
                        {!isCustom && (
                          <span className="text-xs text-muted-foreground font-medium">
                            {tier.pricing[currency].period}
                          </span>
                        )}
                      </div>
                      {billingCycle === "annual" && !isCustom && (
                        <p className="text-xs text-accent font-semibold mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Billed annually with 15% corporate savings
                        </p>
                      )}
                      {isCustom && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Volume discounts & dedicated partner facility agreements
                        </p>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-8">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Plan Includes:
                      </p>
                      {(tier.features as string[]).map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                          <div className="w-4 h-4 rounded-full bg-accent-subtle text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                          <span className="leading-snug">{feature}</span>
                        </div>
                      ))}

                      {tier.notIncluded.length > 0 && (
                        <div className="pt-2 space-y-2 opacity-50">
                          {(tier.notIncluded as string[]).map((item: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
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
                      onClick={() => handleOpenLead('employer')}
                      className={`w-full py-3.5 px-6 rounded-[10px] text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                        tier.popular
                          ? "bg-accent hover:bg-emerald-400 text-accent-foreground shadow-md hover:shadow-lg hover:shadow-accent/20"
                          : tier.id === "enterprise"
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      <span>{tier.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[11px] text-center text-muted-foreground mt-2.5">
                      {tier.id === "enterprise" ? "Custom enterprise SLA" : "Includes full RRA EBM tax compliance"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 bg-card border border-border rounded-[14px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs text-card-foreground">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-subtle text-accent flex items-center justify-center flex-shrink-0 border border-accent/20">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                100% Tax Compliant & Fully Vetted Network
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Every subscription includes single consolidated RRA EBM 18% VAT invoicing, real-time anti-passback biometric security, and dedicated settlement for all partner facilities.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenLead('employer')}
            className="whitespace-nowrap px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold rounded-[10px] transition-colors cursor-pointer"
          >
            Schedule 15-Min Briefing
          </button>
        </div>
      </div>
    </section>
  );
}
