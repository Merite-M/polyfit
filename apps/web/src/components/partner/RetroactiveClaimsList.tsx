'use client';

import React, { useState, useEffect } from 'react';
import {
  ClockAlert,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  ZapOff,
  WifiOff,
  BatteryCharging,
  Compass,
  FileText,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

export interface RetroactiveClaimItem {
  id: string;
  incident_date: string;
  beneficiary_name: string;
  beneficiary_identifier: string;
  organization_name?: string;
  location_name?: string;
  reason: 'power_outage' | 'isp_cut' | 'device_battery_dead' | 'geofence_drift' | string;
  notes?: string;
  evidence_ref?: string;
  status: 'pending' | 'approved' | 'rejected';
  settlement_amount: number;
  created_at: string;
}

interface RetroactiveClaimsListProps {
  onOpenNewClaim: () => void;
  refreshTrigger?: number;
}

export function RetroactiveClaimsList({ onOpenNewClaim, refreshTrigger }: RetroactiveClaimsListProps) {
  const [claims, setClaims] = useState<RetroactiveClaimItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ success: boolean; claims: RetroactiveClaimItem[] }>(
        '/api/visits/retroactive-claims'
      );
      if (res?.claims && Array.isArray(res.claims)) {
        setClaims(res.claims);
      } else {
        setClaims([]);
      }
    } catch (err) {
      console.warn('[RetroactiveClaimsList] Live claims fetch notice:', err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [refreshTrigger]);

  const renderReasonBadge = (reason: string) => {
    switch (reason) {
      case 'power_outage':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <ZapOff className="w-3.5 h-3.5 text-[#D97706]" />
            Power Outage
          </span>
        );
      case 'isp_cut':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
            <WifiOff className="w-3.5 h-3.5 text-[#EF4444]" />
            Fiber / ISP Down
          </span>
        );
      case 'device_battery_dead':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]">
            <BatteryCharging className="w-3.5 h-3.5 text-[#9333EA]" />
            Dead Battery
          </span>
        );
      case 'geofence_drift':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
            <Compass className="w-3.5 h-3.5 text-[#0284C7]" />
            GPS Jitter
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#F1F4F8] text-[#526173]">
            {reason}
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9FAF2] text-[#0B1F33] border border-[#28D17C]/30">
            <CheckCircle2 className="w-3 h-3 text-[#28D17C]" />
            Approved & Payable
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
            <XCircle className="w-3 h-3 text-[#EF4444]" />
            Disallowed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <Clock className="w-3 h-3 text-[#D97706]" />
            Under Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Policy Reconciliation Header Banner */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <ClockAlert className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1E3A8A]">
              Missed Check-ins &amp; Offline Admissions Window
            </h4>
            <p className="text-xs text-[#1E40AF] mt-0.5 leading-relaxed">
              In cases of power outages, internet cuts, or temporary device issues, log missed member visits here.
              All claims for the previous calendar month must be logged on or before the{' '}
              <strong className="font-bold underline">2nd day of the current month</strong> to be credited into the 15th
              provider payout statement.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewClaim}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1F33] text-white text-xs font-semibold hover:bg-[#122A44] transition-colors whitespace-nowrap shadow-xs flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-[#28D17C]" />
          <span>Log Missed Check-in</span>
        </button>
      </div>

      {/* Claims Table Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FBFDFE]">
          <div>
            <h3 className="font-bold text-[#0B1F33] text-sm">Submitted Missed &amp; Offline Claims</h3>
            <p className="text-xs text-[#526173]">
              Track reimbursement status for offline counter admissions, power outages, and internet disruptions
            </p>
          </div>
          <span className="text-xs font-semibold text-[#526173]">
            {claims.length} {claims.length === 1 ? 'Claim' : 'Claims'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#526173] uppercase tracking-wider">
                <th className="py-3 px-4">Incident Time</th>
                <th className="py-3 px-4">Corporate Member</th>
                <th className="py-3 px-4">Corporate Client</th>
                <th className="py-3 px-4">Outage / Reason</th>
                <th className="py-3 px-4">Evidence / Log Reference</th>
                <th className="py-3 px-4">Payout Rate</th>
                <th className="py-3 px-4 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs sm:text-sm">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-[#F8FAFC] transition-colors">
                  {/* Incident Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono font-medium text-[#0B1F33]">
                      {new Date(claim.incident_date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-[11px] text-[#8491A3] font-mono">
                      {new Date(claim.incident_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>

                  {/* Beneficiary */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#0B1F33]">{claim.beneficiary_name}</div>
                    <div className="text-[11px] text-[#526173] font-mono">
                      {claim.beneficiary_identifier}
                    </div>
                  </td>

                  {/* Corporate Client */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#0B1F33]">
                      {claim.organization_name || 'Corporate Partner'}
                    </div>
                    <div className="text-[11px] text-[#8491A3]">
                      {claim.location_name || 'Main Facility'}
                    </div>
                  </td>

                  {/* Reason */}
                  <td className="py-3.5 px-4">{renderReasonBadge(claim.reason)}</td>

                  {/* Evidence / Notes */}
                  <td className="py-3.5 px-4 max-w-[260px]">
                    <p className="text-xs text-[#526173] line-clamp-2 leading-relaxed">
                      {claim.notes || 'Counter paper check-in log on file.'}
                    </p>
                    {claim.evidence_ref && (
                      <span className="inline-block mt-1 font-mono text-[10px] bg-[#F1F4F8] px-1.5 py-0.5 rounded text-[#526173]">
                        Ref: {claim.evidence_ref}
                      </span>
                    )}
                  </td>

                  {/* Settlement */}
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F33]">
                    {claim.settlement_amount.toLocaleString()} RWF
                  </td>

                  {/* Audit Status */}
                  <td className="py-3.5 px-4 text-right">
                    {renderStatusBadge(claim.status)}
                  </td>
                </tr>
              ))}

              {claims.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#526173]">
                    <CheckCircle2 className="w-8 h-8 text-[#28D17C] mx-auto mb-2 opacity-70" />
                    <p className="font-medium text-[#0B1F33] text-sm">No Exception Claims On File</p>
                    <p className="text-xs text-[#8491A3] mt-0.5">
                      All visits recorded today were successfully verified via standard channels.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
