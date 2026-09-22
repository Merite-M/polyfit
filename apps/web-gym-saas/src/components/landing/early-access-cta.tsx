import { Building2, Dumbbell, ArrowRight } from "lucide-react";

interface EarlyAccessCTAProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function EarlyAccessCTA({ onOpenLeadForm }: EarlyAccessCTAProps) {
  return (
    <section className="py-16 sm:py-24 bg-slate-50 text-slate-900 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 mb-2">
            Early Access & Pilot Network
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4 sm:mb-6">
            We're building the next generation of corporate fitness in Rwanda.
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 leading-relaxed">
            PolyFit is currently working with forward-thinking organizations and leading fitness providers to launch its initial corporate fitness networks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Path 1: Employer */}
          <div className="bg-white border border-slate-200/80 rounded-[14px] p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-sm hover:border-emerald-500/50 transition-all duration-200">
            <div>
              <div className="w-12 h-12 rounded-[10px] bg-emerald-100 flex items-center justify-center mb-5 sm:mb-6">
                <Building2 className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                I'm an employer
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                Explore how PolyFit can transform your employee wellness program with flexible, network-based fitness benefits and full usage visibility.
              </p>
            </div>
            <button 
              onClick={() => onOpenLeadForm?.('employer')}
              aria-label="Explore PolyFit - Open employer inquiry form"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-3.5 sm:py-4 rounded-[10px] text-base font-semibold transition-all duration-150 flex items-center justify-center gap-2 min-h-[48px] shadow-sm hover:shadow-md"
            >
              <span>Explore PolyFit</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Path 2: Provider */}
          <div className="bg-white border border-slate-200/80 rounded-[14px] p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-sm hover:border-emerald-500/50 transition-all duration-200">
            <div>
              <div className="w-12 h-12 rounded-[10px] bg-blue-100 flex items-center justify-center mb-5 sm:mb-6">
                <Dumbbell className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                I'm a fitness provider
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                Join the PolyFit network to reach corporate employees, fill off-peak capacity, and grow your facility with verified visit tracking.
              </p>
            </div>
            <button 
              onClick={() => onOpenLeadForm?.('provider')}
              aria-label="Join the network - Open provider registration form"
              className="w-full border border-emerald-500/60 text-emerald-800 hover:bg-emerald-50 px-6 py-3.5 sm:py-4 rounded-[10px] text-base font-semibold transition-all duration-150 flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>Join the network</span>
              <ArrowRight className="w-5 h-5 text-emerald-800" />
            </button>
          </div>
        </div>

        <div className="mt-10 sm:mt-14 text-center">
          <p className="text-[11px] sm:text-xs text-slate-500">
            Currently accepting corporate pilot partners and fitness facilities in Musanze and Kigali.
          </p>
        </div>
      </div>
    </section>
  );
}
