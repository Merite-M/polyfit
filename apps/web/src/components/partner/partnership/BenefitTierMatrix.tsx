'use client';

import React from 'react';
import {
  Check,
  X,
  Shield,
  Layers,
  Info,
  Sparkles,
  HelpCircle,
  Building2,
  Lock,
  ShieldAlert,
  Coins,
  Clock
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

interface ServiceScopeItem {
  id: string;
  service_name: string;
  category: string;
  description: string;
  admission_rule: string;
  is_included: boolean;
  settlement_rate: string;
  settlement_subtext: string;
}

const DEFAULT_SERVICE_SCOPES: ServiceScopeItem[] = [
  {
    id: 'gym-cardio',
    service_name: 'Gym & Cardio Floor',
    category: 'Core Facility',
    description: 'Full access to cardio machines, free weights, strength racks, and stretching zones.',
    admission_rule: 'Dynamic QR Pass • Active Corporate Beneficiary',
    is_included: true,
    settlement_rate: '5,000 RWF',
    settlement_subtext: 'Guaranteed Net Payout / Visit'
  },
  {
    id: 'aquatics',
    service_name: 'Olympic Pool & Aquatic Center',
    category: 'Aquatics',
    description: 'Lap swimming lanes, leisure pool, and deck amenities during open swim hours.',
    admission_rule: 'Dynamic QR Pass • Standard or Executive Benefit',
    is_included: true,
    settlement_rate: '5,000 RWF',
    settlement_subtext: 'Guaranteed Net Payout / Visit'
  },
  {
    id: 'amenities',
    service_name: 'Locker Rooms, Sauna & Showers',
    category: 'Amenities',
    description: 'Secure lockers, hot showers, towel access, and recovery wet areas.',
    admission_rule: 'Included with verified floor admission',
    is_included: true,
    settlement_rate: 'Included',
    settlement_subtext: 'Covered in Visit Rate'
  },
  {
    id: 'group-classes',
    service_name: 'Drop-in Group Fitness Classes',
    category: 'Group Studio',
    description: 'Studio spinning, HIIT, yoga, and functional circuit sessions (subject to room capacity).',
    admission_rule: 'App Pass + In-App Class Reservation',
    is_included: true,
    settlement_rate: '5,000 RWF',
    settlement_subtext: 'Guaranteed Net Payout / Visit'
  },
  {
    id: 'personal-training',
    service_name: '1-on-1 Personal Training / Private Spa',
    category: 'Specialty Services',
    description: 'Dedicated individual coaching sessions, private sports therapy, or boutique salon services.',
    admission_rule: 'Out of Corporate Scope • Direct Facility Fee',
    is_included: false,
    settlement_rate: 'Direct Pay',
    settlement_subtext: 'Billed directly by facility'
  }
];

export function BenefitTierMatrix() {
  const { commercialConditions, provider } = usePartner();
  const perVisitRate = commercialConditions?.active_contract?.per_visit_rate || 5000;
  const currency = commercialConditions?.active_contract?.currency || 'RWF';

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-border p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Network Verified Access & Commercial Rate Card
            </h3>
            <p className="text-xs text-muted-foreground">
              Contracted facility service scope, front desk admission rules, and contract-guaranteed settlement rates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted/50 px-3 py-1 rounded-xl border border-border">
            Facility: <strong className="capitalize text-foreground">{provider?.category || 'Gym'}</strong>
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
            {perVisitRate.toLocaleString()} {currency} / Verified Visit
          </span>
        </div>
      </div>

      {/* Table Display */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40">
              <th className="py-3 px-4 rounded-l-xl">Service Scope & Area</th>
              <th className="py-3 px-4">Front Desk Admission Rule</th>
              <th className="py-3 px-4">Network Status</th>
              <th className="py-3 px-4 rounded-r-xl text-right">Provider Settlement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-xs">
            {DEFAULT_SERVICE_SCOPES.map((service) => {
              const isIncluded = service.is_included;

              return (
                <tr
                  key={service.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    !isIncluded ? 'opacity-70 bg-muted/10' : ''
                  }`}
                >
                  {/* Service Name & Category */}
                  <td className="py-4 px-4 font-bold text-foreground">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isIncluded
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isIncluded ? <Check className="w-4 h-4 stroke-[3]" /> : <Lock className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{service.service_name}</div>
                        <span className="text-[10px] font-normal text-muted-foreground block mt-0.5">
                          {service.description}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Admission Rule */}
                  <td className="py-4 px-4 text-foreground">
                    <span className="font-medium text-xs text-foreground block">
                      {service.admission_rule}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {isIncluded ? 'Validated via Dynamic App Scanner' : 'Direct Member Cash / Card'}
                    </span>
                  </td>

                  {/* Network Status Pill */}
                  <td className="py-4 px-4">
                    {isIncluded ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Corporate Benefit Scope</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Out of Network Scope</span>
                      </span>
                    )}
                  </td>

                  {/* Settlement */}
                  <td className="py-4 px-4 text-right">
                    {isIncluded ? (
                      <div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {service.settlement_rate === 'Included' ? 'Included' : `${perVisitRate.toLocaleString()} ${currency}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {service.settlement_subtext}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-mono font-bold text-muted-foreground text-xs">
                          {service.settlement_rate}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {service.settlement_subtext}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Explanatory Callouts */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-950 dark:text-amber-100 font-semibold">Zero Cash Collection at Front Desk:</strong> All corporate employee visits are 100% funded and settled by PolyFit on Net-15 terms. Never collect any cash, co-pays, or subscription fees from corporate app pass holders.
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-2.5 text-xs text-muted-foreground">
          <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-foreground font-semibold">Anti-Passback & Security:</strong> PolyFit's dynamic TOTP algorithm prevents duplicate entries with an automated 30-minute anti-passback rule and cryptographic pass rotation.
          </div>
        </div>
      </div>
    </div>
  );
}
