"use client";

import { TrendingUp, Users, HeartPulse, Receipt, ArrowRight } from "lucide-react";
import { useLeadModal } from "@/lib/lead-modal";

interface PricingRoiBannerProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function PricingRoiBanner({ onOpenLeadForm }: PricingRoiBannerProps = {}) {
  const openModal = useLeadModal((s) => s.open);
  const handleOpenLead = (type: 'employer' | 'provider' = 'employer') => {
    if (onOpenLeadForm) {
      onOpenLeadForm(type);
    } else {
      openModal(type);
    }
  };

  const stats = [
    {
      value: "25%",
      label: "Reduction in Absenteeism",
      subtext: "Employees with active wellness habits miss fewer days due to preventable health issues.",
      icon: TrendingUp,
    },
    {
      value: "3.2x",
      label: "Measurable Wellness ROI",
      subtext: "Return delivered via reduced private healthcare claims and improved workday stamina.",
      icon: HeartPulse,
    },
    {
      value: "88%",
      label: "Retention & Morale Lift",
      subtext: "Employees rate flexible multi-venue fitness access among their top 3 employer perks.",
      icon: Users,
    },
    {
      value: "100%",
      label: "RRA EBM Deductible",
      subtext: "Itemized with 18% VAT as an approved corporate health expenditure in Rwanda.",
      icon: Receipt,
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-primary text-primary-foreground relative overflow-hidden" aria-labelledby="roi-banner-heading">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-accent text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-xs">
            Financial & Health Impact
          </div>
          <h2 id="roi-banner-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Wellness That Powers Your Bottom Line
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Investing in proactive wellness isn't just an HR perk—it directly cuts absenteeism, strengthens recruitment, and delivers audited corporate ROI.
          </p>
        </div>

        {/* 4-Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-[14px] p-6 hover:bg-white/[0.08] transition-all"
              >
                <div className="w-10 h-10 rounded-[10px] bg-accent/20 text-accent flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-gray-200 mb-2">
                  {stat.label}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {stat.subtext}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Teaser Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 bg-white/10 border border-white/15 rounded-[14px] backdrop-blur-md">
          <div>
            <h3 className="text-lg font-bold text-white">
              Want a personalized ROI simulation for your company headcount?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Calculate exact monthly expenditure and projected productivity returns based on your staff size.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href="/#roi-calculator"
              className="w-full sm:w-auto text-center px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-[10px] transition-colors border border-white/20"
            >
              Test ROI Calculator
            </a>
            <button
              type="button"
              onClick={() => handleOpenLead('employer')}
              className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 bg-accent hover:bg-emerald-400 text-accent-foreground text-xs sm:text-sm font-bold rounded-[10px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Custom Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
