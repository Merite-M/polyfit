import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles, Building2, Users, Receipt, CheckCircle2 } from "lucide-react";
import { LeadModalTrigger } from "./lead-modal-trigger";

interface HeroProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function Hero({ onOpenLeadForm }: HeroProps = {}) {
  return (
    <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden bg-slate-900 text-white">
      {/* Background subtle ambient grid/glow */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(var(--accent)_1px,transparent_1px)] [background-size:28px_28px]"
        aria-hidden="true"
      />
      
      {/* Luminous subtle gradient wash */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-accent/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
        
        {/* Pill Announcement */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>B2B2C Corporate Wellness Infrastructure</span>
          <span className="text-slate-400">•</span>
          <Link href="/network" className="text-accent hover:underline flex items-center gap-0.5 font-bold">
            Explore 15+ Venues <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight text-white leading-[1.1] sm:leading-[1.06] max-w-4xl mx-auto">
          One Benefit. Multiple Providers. <br />
          <span className="text-accent">Healthier Teams.</span>
        </h1>

        {/* Subcopy */}
        <p className="text-base sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
          Connect your workforce to Rwanda&apos;s premier network of independent fitness, swimming, and wellness facilities through a single corporate benefit. Employers get real-time utilization telemetry and consolidated 18% VAT invoicing; employees get the freedom to exercise anywhere.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-3">
          <LeadModalTrigger 
            type="employer"
            ariaLabel="Talk to PolyFit - Open employer inquiry form"
            className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-primary px-8 py-4 rounded-[12px] text-base font-bold transition-all duration-150 flex items-center justify-center gap-2 min-h-[50px] shadow-lg shadow-accent/20 active:scale-95 cursor-pointer"
          >
            Talk to PolyFit
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </LeadModalTrigger>

          <Link 
            href="/pricing"
            className="w-full sm:w-auto border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white px-7 py-4 rounded-[12px] text-base font-semibold transition-all duration-150 flex items-center justify-center min-h-[50px] text-center"
          >
            View Plans & Pricing
          </Link>
        </div>

        {/* Executive Highlights Bar */}
        <div className="pt-8 sm:pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
          <div className="p-3.5 sm:p-4 rounded-[12px] bg-slate-800/70 border border-slate-700">
            <p className="text-[11px] font-mono text-accent font-semibold uppercase tracking-wider">Network Reach</p>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">15+ Premier Venues</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Kigali & regional hubs</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-[12px] bg-slate-800/70 border border-slate-700">
            <p className="text-[11px] font-mono text-secondary font-semibold uppercase tracking-wider">Administration</p>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">1 Policy • 0 Silos</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Zero direct gym contracts</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-[12px] bg-slate-800/70 border border-slate-700">
            <p className="text-[11px] font-mono text-highlight font-semibold uppercase tracking-wider">Tax & Finance</p>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">18% VAT EBM</p>
            <p className="text-[11px] text-slate-400 mt-0.5">100% tax deductible expense</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-[12px] bg-slate-800/70 border border-slate-700">
            <p className="text-[11px] font-mono text-accent font-semibold uppercase tracking-wider">Verification</p>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">Dynamic TOTP</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Anti-passback protected</p>
          </div>
        </div>

        {/* Trust & Proof Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-300">
          <Link href="/network" className="flex items-center gap-1.5 hover:text-white transition-colors group">
            <BadgeCheck className="w-4 h-4 text-accent" />
            <span className="group-hover:underline">15+ Verified Locations in Kigali</span>
            <ArrowRight className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>RRA EBM Invoicing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-highlight" />
            <span>Zero Account Sharing</span>
          </div>
        </div>

      </div>
    </section>
  );
}
