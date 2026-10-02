'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  DoorOpen,
  UserCheck,
  Wifi,
  Search,
  AlertTriangle,
  RefreshCw,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch } from '@/lib/api-client';

export interface TodayVisit {
  id: string;
  check_in_at: string;
  status: 'pending' | 'verified' | 'rejected' | 'disputed';
  verification_method: 'totp_qr' | 'manual' | 'turnstile' | 'nfc' | string;
  reimbursement_rate?: number;
  is_disputed?: boolean;
  dispute_reason?: string;
  employees?: {
    id: string;
    full_name: string;
    email: string;
    tier?: string;
    department?: string;
    employee_id_external?: string;
  };
  organizations?: {
    id: string;
    name: string;
  };
  provider_locations?: {
    id: string;
    name: string;
  };
}

interface TodayCheckinFeedProps {
  onFlagDispute: (visit: TodayVisit) => void;
  refreshTrigger?: number;
}

// Fallback seed visits for realistic testing and demonstration
const DEFAULT_TODAY_VISITS: TodayVisit[] = [
  {
    id: 'vis-today-101',
    check_in_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4m ago
    status: 'verified',
    verification_method: 'totp_qr',
    reimbursement_rate: 5000,
    employees: {
      id: 'emp-101',
      full_name: 'Aline Umutoni',
      email: 'a.umutoni@bk.rw',
      tier: 'Executive',
      department: 'Corporate Banking',
      employee_id_external: 'BK-8902'
    },
    organizations: {
      id: 'org-bk',
      name: 'Bank of Kigali Plc'
    },
    provider_locations: {
      id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
      name: 'Kigali Central Facility'
    }
  },
  {
    id: 'vis-today-102',
    check_in_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(), // 14m ago
    status: 'verified',
    verification_method: 'turnstile',
    reimbursement_rate: 5000,
    employees: {
      id: 'emp-102',
      full_name: 'Jean-Luc Habimana',
      email: 'jl.habimana@mtn.rw',
      tier: 'Standard',
      department: 'Network Operations',
      employee_id_external: 'MTN-4421'
    },
    organizations: {
      id: 'org-mtn',
      name: 'MTN Rwandacell'
    },
    provider_locations: {
      id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
      name: 'Kigali Central Facility'
    }
  },
  {
    id: 'vis-today-103',
    check_in_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32m ago
    status: 'verified',
    verification_method: 'manual',
    reimbursement_rate: 5000,
    employees: {
      id: 'emp-103',
      full_name: 'Grace Mutoniwase',
      email: 'grace.m@imbank.rw',
      tier: 'Standard',
      department: 'Finance & Audit',
      employee_id_external: 'IM-1099'
    },
    organizations: {
      id: 'org-im',
      name: 'I&M Bank Rwanda'
    },
    provider_locations: {
      id: '189e7cb8-155e-419a-8b83-bd9e3eb021da',
      name: 'Nyarutarama Health Branch'
    }
  },
  {
    id: 'vis-today-104',
    check_in_at: new Date(Date.now() - 58 * 60 * 1000).toISOString(), // 58m ago
    status: 'verified',
    verification_method: 'totp_qr',
    reimbursement_rate: 5000,
    employees: {
      id: 'emp-104',
      full_name: 'Patrick Kayisire',
      email: 'p.kayisire@bboxx.com',
      tier: 'Executive',
      department: 'Field Engineering',
      employee_id_external: 'BBX-3012'
    },
    organizations: {
      id: 'org-bbx',
      name: 'Bboxx Capital Rwanda'
    },
    provider_locations: {
      id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
      name: 'Kigali Central Facility'
    }
  },
  {
    id: 'vis-today-105',
    check_in_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    status: 'disputed',
    is_disputed: true,
    dispute_reason: 'beneficiary_impersonation',
    verification_method: 'totp_qr',
    reimbursement_rate: 5000,
    employees: {
      id: 'emp-105',
      full_name: 'Emmanuel Nshimiyimana',
      email: 'e.nshimi@airtel.rw',
      tier: 'Standard',
      department: 'Commercial Sales',
      employee_id_external: 'ART-5510'
    },
    organizations: {
      id: 'org-airtel',
      name: 'Airtel Rwanda'
    },
    provider_locations: {
      id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
      name: 'Kigali Central Facility'
    }
  }
];

export function TodayCheckinFeed({ onFlagDispute, refreshTrigger }: TodayCheckinFeedProps) {
  const { selectedLocationId } = usePartner();
  const [visits, setVisits] = useState<TodayVisit[]>(DEFAULT_TODAY_VISITS);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchTodayVisits = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedLocationId && selectedLocationId !== 'all') {
        params.append('provider_location_id', selectedLocationId);
      }
      params.append('status', 'verified');
      params.append('limit', '50');

      const res = await apiFetch<{ success: boolean; visits: TodayVisit[] }>(
        `/api/visits?${params.toString()}`
      );

      if (res?.visits && res.visits.length > 0) {
        setVisits(res.visits);
      }
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.warn('[TodayCheckinFeed] Live feed network fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and 5s auto-polling
  useEffect(() => {
    fetchTodayVisits();
    const interval = setInterval(fetchTodayVisits, 10000); // 10s auto polling
    return () => clearInterval(interval);
  }, [selectedLocationId, refreshTrigger]);

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      // Location filter
      if (
        selectedLocationId !== 'all' &&
        v.provider_locations?.id &&
        v.provider_locations.id !== selectedLocationId
      ) {
        return false;
      }

      // Method filter
      if (methodFilter !== 'all' && v.verification_method !== methodFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'disputed' && !v.is_disputed && v.status !== 'disputed') {
        return false;
      }
      if (statusFilter === 'verified' && (v.is_disputed || v.status === 'disputed')) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = v.employees?.full_name?.toLowerCase() || '';
        const empEmail = v.employees?.email?.toLowerCase() || '';
        const empCode = v.employees?.employee_id_external?.toLowerCase() || '';
        const orgName = v.organizations?.name?.toLowerCase() || '';
        return (
          empName.includes(q) ||
          empEmail.includes(q) ||
          empCode.includes(q) ||
          orgName.includes(q)
        );
      }

      return true;
    });
  }, [visits, selectedLocationId, methodFilter, statusFilter, searchQuery]);

  const renderMethodBadge = (method: string) => {
    switch (method) {
      case 'turnstile':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E9FAF2] text-[#0B1F33] border border-[#28D17C]/30">
            <DoorOpen className="w-3.5 h-3.5 text-[#28D17C]" />
            Turnstile Gate
          </span>
        );
      case 'totp_qr':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
            <QrCode className="w-3.5 h-3.5 text-[#0284C7]" />
            Dynamic QR
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <UserCheck className="w-3.5 h-3.5 text-[#D97706]" />
            Counter PIN
          </span>
        );
      case 'nfc':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]">
            <Wifi className="w-3.5 h-3.5 text-[#9333EA]" />
            NFC Card
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F4F8] text-[#526173]">
            {method}
          </span>
        );
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const formatRelative = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.max(0, Math.floor(diffMs / 60000));
      if (mins === 0) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
      {/* Feed Controls Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#FBFDFE]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#8491A3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search beneficiary, ID, employer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33] placeholder-[#8491A3]"
            />
          </div>

          {/* Verification Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#0B1F33] font-medium focus:outline-none focus:ring-2 focus:ring-[#28D17C] cursor-pointer"
          >
            <option value="all">All Verification Methods</option>
            <option value="totp_qr">Dynamic QR (App)</option>
            <option value="turnstile">Automated Turnstile</option>
            <option value="manual">Counter PIN / Manual</option>
            <option value="nfc">NFC Badge</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#0B1F33] font-medium focus:outline-none focus:ring-2 focus:ring-[#28D17C] cursor-pointer"
          >
            <option value="all">All Check-in Statuses</option>
            <option value="verified">Verified Normal</option>
            <option value="disputed">Flagged / Under Review</option>
          </select>
        </div>

        {/* Live Refresh Status */}
        <div className="flex items-center justify-between lg:justify-end gap-3 text-xs text-[#526173]">
          <span className="hidden sm:inline">
            Showing <strong className="text-[#0B1F33]">{filteredVisits.length}</strong> visits today
          </span>
          <button
            onClick={fetchTodayVisits}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#526173] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table Feed */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#526173] uppercase tracking-wider">
              <th className="py-3 px-4">Beneficiary</th>
              <th className="py-3 px-4">Corporate Client</th>
              <th className="py-3 px-4">Facility & Gate</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Rate (RWF)</th>
              <th className="py-3 px-4">Check-in Time</th>
              <th className="py-3 px-4 text-right">Operational Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-xs sm:text-sm">
            {filteredVisits.map((visit) => {
              const isFlagged = visit.is_disputed || visit.status === 'disputed';
              const beneficiaryName = visit.employees?.full_name || 'Beneficiary';
              const initials = beneficiaryName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
              const isVeryRecent = Math.abs(Date.now() - new Date(visit.check_in_at).getTime()) < 20000;

              return (
                <tr
                  key={visit.id}
                  className={`pf-feed-row-enter hover:bg-[#F8FAFC] transition-colors ${
                    isVeryRecent ? 'pf-feed-row-new' : ''
                  } ${isFlagged ? 'bg-[#FFFBEB]' : ''}`}
                >
                  {/* Beneficiary Profile */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E9FAF2] text-[#28D17C] font-bold text-xs flex items-center justify-center border border-[#28D17C]/20 flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-[#0B1F33] flex items-center gap-1.5">
                          <span>{beneficiaryName}</span>
                          {visit.employees?.tier && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F1F4F8] text-[#526173]">
                              {visit.employees.tier}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#526173] font-mono">
                          {visit.employees?.employee_id_external || visit.employees?.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Corporate Client */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-[#0B1F33]">
                      <Building className="w-3.5 h-3.5 text-[#8491A3] flex-shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-[180px]">
                        {visit.organizations?.name || 'Corporate Partner'}
                      </span>
                    </div>
                    {visit.employees?.department && (
                      <div className="text-[11px] text-[#8491A3] truncate max-w-[180px]">
                        {visit.employees.department}
                      </div>
                    )}
                  </td>

                  {/* Facility */}
                  <td className="py-3.5 px-4 text-[#526173]">
                    <div className="font-medium text-[#0B1F33] truncate max-w-[140px]">
                      {visit.provider_locations?.name || 'Main Facility'}
                    </div>
                    <div className="text-[11px] text-[#8491A3] font-mono">
                      Terminal #{visit.id.slice(-6).toUpperCase()}
                    </div>
                  </td>

                  {/* Verification Method */}
                  <td className="py-3.5 px-4">
                    {renderMethodBadge(visit.verification_method)}
                  </td>

                  {/* Settlement Rate */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-[#0B1F33]">
                      {Number(visit.reimbursement_rate || 5000).toLocaleString()} RWF
                    </span>
                    <div className="text-[10px] text-[#28D17C] font-semibold">Payable to Provider</div>
                  </td>

                  {/* Timestamp */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono text-[#0B1F33] font-medium">
                      {formatTime(visit.check_in_at)}
                    </div>
                    <div className="text-[11px] text-[#8491A3] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelative(visit.check_in_at)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    {isFlagged ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
                        Flagged Misuse
                      </span>
                    ) : (
                      <button
                        onClick={() => onFlagDispute(visit)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#526173] hover:text-[#EF4444] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FCA5A5] transition-colors"
                        title="Report impersonation or fraudulent check-in"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Flag Misuse</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredVisits.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#526173]">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#F1F4F8] flex items-center justify-center mb-3 text-[#8491A3]">
                      <CheckCircle2 className="w-6 h-6 text-[#28D17C]" />
                    </div>
                    <h4 className="font-semibold text-[#0B1F33] text-sm">No Check-ins Found</h4>
                    <p className="text-xs text-[#8491A3] mt-1">
                      {searchQuery
                        ? 'No check-ins match your search filter criteria.'
                        : 'No employee check-ins have been recorded today for this location.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
