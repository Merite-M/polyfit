'use client';

import React from 'react';
import {
  Building2,
  Users,
  Receipt,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { formatRwf } from '@/lib/invoice-pdf';

export function TopEmployersCard() {
  const { dashboardData } = usePartner();

  const topOrgs = dashboardData?.top_organizations || [];
  const totalVisitsMtd = dashboardData?.kpis.mtd_total_visits || 1;

  // Colors for employer progress meters
  const colorPalette = [
    { bar: 'bg-[#28D17C]', bg: 'bg-[#E9FAF2]', text: 'text-[#008A4B]' },
    { bar: 'bg-[#3B82F6]', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]' },
    { bar: 'bg-[#8B5CF6]', bg: 'bg-[#F5F3FF]', text: 'text-[#6D28D9]' },
    { bar: 'bg-[#F59E0B]', bg: 'bg-[#FFFBEB]', text: 'text-[#B45309]' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F4F8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1F33]">
                Top Corporate Clients Breakdown
              </h3>
              <p className="text-xs text-[#526173]">
                Organizations generating the highest employee check-in volume.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-[#526173] bg-[#F7F9FC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
            MTD Share
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {topOrgs.map((org, index) => {
            const colors = colorPalette[index % colorPalette.length];
            const pct = org.visit_share_pct || Math.round((org.visit_count / totalVisitsMtd) * 100);

            return (
              <div key={org.org_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-[#F1F4F8] text-[#526173] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-bold text-[#0B1F33] truncate">
                      {org.org_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-[11px]">
                    <span className="text-[#526173]">
                      <strong className="text-[#0B1F33]">{org.visit_count}</strong> visits
                    </span>
                    <span className="font-mono font-bold text-[#008A4B]">
                      {formatRwf(org.gross_earnings)}
                    </span>
                    <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${colors.bg} ${colors.text}`}>
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Meter Bar */}
                <div className="w-full h-2 rounded-full bg-[#F1F4F8] overflow-hidden">
                  <div
                    style={{ width: `${Math.max(pct, 4)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#8491A3] px-0.5">
                  <span>{org.unique_employees_count} active employees this month</span>
                  <span>100% Employer Funded</span>
                </div>
              </div>
            );
          })}

          {topOrgs.length === 0 && (
            <div className="text-center py-6 text-xs text-[#526173]">
              No corporate check-in activity recorded yet for this period.
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-[#F1F4F8] flex items-center justify-between text-xs text-[#526173]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
          <span>Guaranteed B2B2C Settlement by PolyFit</span>
        </div>
        <span className="font-mono text-[11px] text-[#8491A3]">Verified RRA EBM</span>
      </div>
    </div>
  );
}
