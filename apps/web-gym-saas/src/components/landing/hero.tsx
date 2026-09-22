"use client";

import { ArrowRight } from "lucide-react";
import NetworkVisualization from "./network-visualization";

interface HeroProps {
  onOpenLeadForm: (type: 'employer' | 'provider') => void;
}

export default function Hero({ onOpenLeadForm }: HeroProps) {
  return (
    <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-white text-slate-900">
      {/* Background subtle ambient grid/glow */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-8 items-center">
          {/* Left Content (7 cols) */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-6">
              Corporate fitness, without the limits.
            </h1>
            <p className="text-base sm:text-xl text-slate-600 leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0 font-normal">
              PolyFit connects companies and their employees to a network of gyms and fitness providers—giving employees more choice while helping employers make their wellness benefits more accessible and measurable.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => onOpenLeadForm('employer')}
                aria-label="Talk to PolyFit - Open employer inquiry form"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 sm:px-8 py-3.5 sm:py-4 rounded-[10px] text-base font-semibold transition-all duration-150 flex items-center justify-center gap-2 min-h-[48px] shadow-lg shadow-emerald-500/10"
              >
                Talk to PolyFit
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onOpenLeadForm('provider')}
                aria-label="Join the Provider Network - Open provider form"
                className="w-full sm:w-auto border border-emerald-500/60 text-emerald-800 hover:bg-emerald-50 px-6 sm:px-8 py-3.5 sm:py-4 rounded-[10px] text-base font-semibold transition-all duration-150 flex items-center justify-center min-h-[48px]"
              >
                Join the Provider Network
              </button>
            </div>
          </div>

          {/* Right Visual (5 cols) */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end overflow-hidden">
            <NetworkVisualization />
          </div>
        </div>
      </div>
    </section>
  );
}
