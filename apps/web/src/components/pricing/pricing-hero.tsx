import { ShieldCheck, Receipt, CalendarClock, Dumbbell } from "lucide-react";

export default function PricingHero() {
  return (
    <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 bg-slate-900 text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-accent text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
          <span>Employer Benefits & Transparent Pricing</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Invest in Your Team's Health. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
            Without the Administrative Headache.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          One transparent per-employee subscription. Zero gym contracts. One consolidated monthly RRA EBM invoice and full access to Rwanda's leading fitness facilities.
        </p>

        {/* Trust Value Badges with High Contrast Solid Dark Styling */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full shadow-xs hover:border-accent/60 hover:bg-slate-700 transition-colors">
            <Dumbbell className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="font-semibold text-white">50+ Vetted Venues</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full shadow-xs hover:border-accent/60 hover:bg-slate-700 transition-colors">
            <Receipt className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="font-semibold text-white">RRA EBM 18% VAT Invoicing</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full shadow-xs hover:border-accent/60 hover:bg-slate-700 transition-colors">
            <CalendarClock className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="font-semibold text-white">90-Day Flexible Pilots</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full shadow-xs hover:border-accent/60 hover:bg-slate-700 transition-colors">
            <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="font-semibold text-white">Anti-Passback Fraud Lock</span>
          </div>
        </div>
      </div>
    </section>
  );
}
