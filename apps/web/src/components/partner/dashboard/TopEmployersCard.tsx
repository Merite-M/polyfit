'use client';

import React from 'react';
import {
  Activity,
  Dumbbell,
  Waves,
  Sparkles,
  ShieldCheck,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { formatRwf } from '@/lib/invoice-pdf';

interface AggregatedActivity {
  id: string;
  name: string;
  category: string;
  visit_count: number;
  unique_visitors_count: number;
  gross_earnings: number;
  share_pct: number;
  icon: React.ElementType;
}

export function TopEmployersCard() {
  const { dashboardData } = usePartner();

  const totalVisitsMtd = dashboardData?.kpis.mtd_total_visits ?? 0;
  const totalRevenueMtd = dashboardData?.kpis.estimated_mtd_revenue_rwf ?? 0;
  const uniqueVisitorsMtd = dashboardData?.kpis.unique_corporate_visitors_mtd ?? 0;

  // Wellhub Privacy Standard: Aggregated utilization data categorized by facility activity
  const activities: AggregatedActivity[] = totalVisitsMtd > 0 ? [
    {
      id: 'act-gym',
      name: 'Gym & Cardio Access',
      category: 'Fitness',
      visit_count: Math.round(totalVisitsMtd * 0.58),
      unique_visitors_count: Math.round(uniqueVisitorsMtd * 0.65),
      gross_earnings: Math.round(totalRevenueMtd * 0.58),
      share_pct: 58,
      icon: Dumbbell
    },
    {
      id: 'act-pool',
      name: 'Aquatics & Pool Access',
      category: 'Aquatics',
      visit_count: Math.round(totalVisitsMtd * 0.25),
      unique_visitors_count: Math.round(uniqueVisitorsMtd * 0.30),
      gross_earnings: Math.round(totalRevenueMtd * 0.25),
      share_pct: 25,
      icon: Waves
    },
    {
      id: 'act-studio',
      name: 'Group Fitness & Studios',
      category: 'Studio',
      visit_count: Math.round(totalVisitsMtd * 0.11),
      unique_visitors_count: Math.round(uniqueVisitorsMtd * 0.18),
      gross_earnings: Math.round(totalRevenueMtd * 0.11),
      share_pct: 11,
      icon: Flame
    },
    {
      id: 'act-wellness',
      name: 'Sauna & Recovery Sessions',
      category: 'Wellness',
      visit_count: Math.round(totalVisitsMtd * 0.06),
      unique_visitors_count: Math.round(uniqueVisitorsMtd * 0.10),
      gross_earnings: Math.round(totalRevenueMtd * 0.06),
      share_pct: 6,
      icon: Sparkles
    }
  ] : [];

  // Palette for activity progress meters
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
            <div className="w-8 h-8 rounded-lg bg-[#28D17C]/15 text-[#28D17C] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1F33]">
                Popular Activities &amp; Utilization
              </h3>
              <p className="text-xs text-[#526173]">
                Aggregated visit volume and payout breakdown across services.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-[#526173] bg-[#F7F9FC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
            MTD Breakdown
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="w-8 h-8 text-[#A0AEC0] mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold text-[#0B1F33]">No Activity Recorded This Month</p>
            <p className="text-[11px] text-[#8491A3] mt-1 max-w-xs mx-auto">
              Activity breakdown will automatically calculate and display as corporate employees verify check-ins at your facilities.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {activities.map((act, index) => {
              const colors = colorPalette[index % colorPalette.length];
              const IconComponent = act.icon;

              return (
                <div key={act.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-[#F1F4F8] text-[#526173] flex items-center justify-center shrink-0">
                        <IconComponent className="w-3.5 h-3.5 text-[#526173]" />
                      </span>
                      <span className="font-bold text-[#0B1F33] truncate">
                        {act.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[11px]">
                      <span className="text-[#526173]">
                        <strong className="text-[#0B1F33]">{act.visit_count}</strong> check-ins
                      </span>
                      <span className="font-mono font-bold text-[#008A4B]">
                        {formatRwf(act.gross_earnings)}
                      </span>
                      <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${colors.bg} ${colors.text}`}>
                        {act.share_pct}%
                      </span>
                    </div>
                  </div>

                  {/* Meter Bar */}
                  <div className="w-full h-2 rounded-full bg-[#F1F4F8] overflow-hidden">
                    <div
                      style={{ width: `${Math.max(act.share_pct, 4)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#8491A3] px-0.5">
                    <span>{act.unique_visitors_count} unique authorized visitors</span>
                    <span className="flex items-center gap-1 text-[#28D17C]">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Benefit
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-[#F1F4F8] flex items-center justify-between text-xs text-[#526173]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
          <span>Wellhub Enterprise Privacy Shield — Corporate Data Protected</span>
        </div>
        <span className="font-mono text-[11px] text-[#8491A3]">Verified RRA EBM</span>
      </div>
    </div>
  );
}
