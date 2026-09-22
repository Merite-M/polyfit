import { Building2, Users, Dumbbell } from "lucide-react";

export default function CredibilityStrip() {
  return (
    <section className="bg-slate-50/80 border-y border-slate-200/80 py-6 sm:py-8" aria-label="Value proposition summary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-5 sm:mb-6">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Enterprise Infrastructure
          </p>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 px-2">
            Built for the way modern organizations manage employee wellness.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6 pt-2">
          {/* Employers */}
          <div className="flex items-center gap-3.5 bg-white rounded-[12px] p-3.5 sm:p-4 border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-[10px] bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">For Employers</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">Centralized benefit management</p>
            </div>
          </div>

          {/* Employees */}
          <div className="flex items-center gap-3.5 bg-white rounded-[12px] p-3.5 sm:p-4 border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-[10px] bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">For Employees</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">Freedom to choose where to exercise</p>
            </div>
          </div>

          {/* Providers */}
          <div className="flex items-center gap-3.5 bg-white rounded-[12px] p-3.5 sm:p-4 border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-[10px] bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">For Providers</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">New corporate customers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
