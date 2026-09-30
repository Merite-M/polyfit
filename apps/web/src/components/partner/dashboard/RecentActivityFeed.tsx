'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  QrCode,
  Cpu,
  UserCheck
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

export function RecentActivityFeed() {
  const { dashboardData } = usePartner();
  const activities = dashboardData?.recent_activity || [];

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'totp_qr':
        return { label: 'Dynamic QR', icon: QrCode, bg: 'bg-[#E9FAF2]', text: 'text-[#008A4B]' };
      case 'turnstile':
        return { label: 'IoT Turnstile', icon: Cpu, bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]' };
      case 'manual':
        return { label: 'Desk Manual', icon: UserCheck, bg: 'bg-[#FFFBEB]', text: 'text-[#B45309]' };
      default:
        return { label: 'Verified Pass', icon: CheckCircle2, bg: 'bg-[#F1F4F8]', text: 'text-[#526173]' };
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F4F8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#28D17C]/15 text-[#008A4B] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1F33]">
                Live Check-in Stream
              </h3>
              <p className="text-xs text-[#526173]">
                Recent corporate employee arrivals at this facility.
              </p>
            </div>
          </div>

          <Link
            href="/partner/checkins"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#008A4B] hover:text-[#0B1F33] transition-colors"
          >
            <span>Live Counter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-3.5 divide-y divide-[#F1F4F8]">
          {activities.map((act) => {
            const badge = getMethodBadge(act.verification_method);
            const Icon = badge.icon;

            return (
              <div key={act.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-center text-[#526173] font-mono text-[10px] font-bold shrink-0">
                    OK
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-[#0B1F33]">
                        {act.employee_masked}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded ${badge.bg} ${badge.text}`}>
                        <Icon className="w-2.5 h-2.5" />
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#526173] truncate">
                      {act.employer_name}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono font-medium text-[#8491A3] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#8491A3]" />
                    <span>{formatTimeAgo(act.check_in_at)}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#008A4B] bg-[#E9FAF2] px-1.5 py-0.2 rounded font-mono">
                    +5,000 RWF
                  </span>
                </div>
              </div>
            );
          })}

          {activities.length === 0 && (
            <div className="text-center py-6 text-xs text-[#526173]">
              No check-ins recorded yet today.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F4F8] flex items-center justify-between text-[11px] text-[#526173]">
        <span>Anti-passback active: 3-hour lock</span>
        <span className="text-[#008A4B] font-semibold">Real-time Verified</span>
      </div>
    </div>
  );
}
