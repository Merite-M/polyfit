import { ShieldCheck, Receipt, CalendarClock, Dumbbell } from "lucide-react";

export default function PricingHero() {
  return (
    <section className="pt-24 sm:pt-32 pb-8 sm:pb-12 bg-gradient-to-b from-slate-900 via-slate-900 to-background text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-accent text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-xs">
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
        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          One transparent per-employee subscription. Zero gym contracts. One consolidated monthly RRA EBM invoice and full access to Rwanda's leading fitness facilities.
        </p>

        {/* Trust Value Badges */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-full backdrop-blur-xs">
            <Dumbbell className="w-4 h-4 text-accent" />
            <span>50+ Vetted Venues</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-full backdrop-blur-xs">
            <Receipt className="w-4 h-4 text-accent" />
            <span>RRA EBM 18% VAT Invoicing</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-full backdrop-blur-xs">
            <CalendarClock className="w-4 h-4 text-accent" />
            <span>90-Day Flexible Pilots</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-full backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Anti-Passback Fraud Lock</span>
          </div>
        </div>
      </div>
    </section>
  );
}
