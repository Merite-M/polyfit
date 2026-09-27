"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import NetworkVisualization from "./network-visualization";

interface HeroProps {
  onOpenLeadForm: (type: 'employer' | 'provider') => void;
}

export default function Hero({ onOpenLeadForm }: HeroProps) {
  return (
    <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 lg:pt-36 lg:pb-24 overflow-hidden bg-[#0B1F33] text-white">
      {/* Background subtle ambient grid/glow */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#28D17C_1px,transparent_1px)] [background-size:28px_28px]"
        aria-hidden="true"
      />
      
      {/* Luminous subtle gradient wash */}
      <div 
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#28D17C]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-8 items-center">
          
          {/* Left Content (7 cols) */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-[#28D17C]" />
              <span>B2B2C Corporate Wellness Infrastructure</span>
              <span className="text-slate-400">•</span>
              <Link href="/brand" className="text-[#28D17C] hover:underline flex items-center gap-0.5">
                Brand Tokens <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Primary Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-[1.12] sm:leading-[1.08]">
              One Benefit. <br className="hidden sm:inline" />
              Multiple Providers. <br className="hidden sm:inline" />
              <span className="text-[#28D17C]">Healthier Teams.</span>
            </h1>

            {/* Subcopy */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              Connect your workforce to Rwanda&apos;s premier network of independent fitness, swimming, and wellness providers through a single corporate benefit. Employers get real-time utilization telemetry and consolidated 18% VAT invoicing; employees get the freedom to exercise anywhere.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center lg:justify-start pt-2">
              <button 
                onClick={() => onOpenLeadForm('employer')}
                aria-label="Talk to PolyFit - Open employer inquiry form"
                className="w-full sm:w-auto bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] px-7 py-3.5 sm:py-4 rounded-[10px] text-base font-bold transition-all duration-150 flex items-center justify-center gap-2 min-h-[48px] shadow-lg shadow-[#28D17C]/20 active:scale-95 cursor-pointer"
              >
                Talk to PolyFit
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              <Link 
                href="/pricing"
                className="w-full sm:w-auto border border-white/20 text-white hover:bg-white/10 hover:border-white/30 px-6 sm:px-7 py-3.5 sm:py-4 rounded-[10px] text-base font-semibold transition-all duration-150 flex items-center justify-center min-h-[48px] text-center"
              >
                View Plans & Pricing
              </Link>
            </div>

            {/* Trust & Proof Strip */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-300">
              <Link href="/network" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                <BadgeCheck className="w-4 h-4 text-[#28D17C]" />
                <span className="group-hover:underline">15+ Verified Locations in Kigali</span>
                <ArrowRight className="w-3 h-3 text-[#28D17C] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
                <span>RRA EBM 18% VAT Invoicing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#B8F36B]" />
                <span>Dynamic Anti-Passback Passes</span>
              </div>
            </div>

          </div>

          {/* Right Visual (5 cols) - Telemetry Hub */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <NetworkVisualization />
          </div>

        </div>
      </div>
    </section>
  );
}
