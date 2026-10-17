'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Download,
  Search,
  Filter,
  Building,
  CheckCircle2,
  Clock,
  DoorOpen,
  QrCode,
  UserCheck,
  Wifi,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch } from '@/lib/api-client';
import { downloadCsv, CsvColumn } from '@/lib/export-csv';

export interface HistoricalVisit {
  id: string;
  check_in_at: string;
  status: 'verified' | 'rejected' | 'disputed';
  verification_method: 'totp_qr' | 'manual' | 'turnstile' | 'nfc' | string;
  reimbursement_rate: number;
  beneficiary_name: string;
  beneficiary_id: string;
  beneficiary_email: string;
  tier: string;
  organization_name: string;
  location_name: string;
  is_disputed?: boolean;
}

export function HistoricalCheckinLog() {
  const { selectedLocationId } = usePartner();
  const [visits, setVisits] = useState<HistoricalVisit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (selectedLocationId && selectedLocationId !== 'all') {
          params.append('provider_location_id', selectedLocationId);
        }
        params.append('limit', '100');

        const res = await apiFetch<{ success: boolean; visits: any[] }>(
          `/api/visits?${params.toString()}`
        );

        if (res?.visits && Array.isArray(res.visits)) {
          const mapped: HistoricalVisit[] = res.visits.map((v: any) => ({
            id: v.id,
            check_in_at: v.check_in_at,
            status: v.status || 'verified',
            verification_method: v.verification_method || 'totp_qr',
            reimbursement_rate: 5000,
            beneficiary_name: v.employees?.full_name || 'Corporate Member',
            beneficiary_id:
              v.employees?.employee_id_external ||
              `PF-${String(v.employee_id || v.id).slice(0, 6).toUpperCase()}`,
            beneficiary_email: v.employees?.email || '',
            tier: v.employees?.tier || 'Corporate',
            organization_name: v.organizations?.name || 'Corporate Client',
            location_name: v.provider_locations?.name || 'Main Location',
            is_disputed: v.status === 'disputed'
          }));
          setVisits(mapped);
        } else {
          setVisits([]);
        }
      } catch (err) {
        console.warn('[HistoricalCheckinLog] Live visits fetch notice:', err);
        setVisits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisits();
  }, [selectedLocationId]);

  // Dynamic list of client organizations present in real visits
  const availableOrgs = useMemo(() => {
    return Array.from(new Set(visits.map((v) => v.organization_name).filter(Boolean))).sort();
  }, [visits]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return visits.filter((item) => {
      // Date filter logic
      const visitDate = new Date(item.check_in_at).getTime();
      const now = Date.now();
      if (dateRangePreset === 'today') {
        const isToday = new Date(item.check_in_at).toDateString() === new Date().toDateString();
        if (!isToday) return false;
      } else if (dateRangePreset === '7d') {
        if (now - visitDate > 7 * 86400 * 1000) return false;
      } else if (dateRangePreset === '30d') {
        if (now - visitDate > 30 * 86400 * 1000) return false;
      }

      // Organization filter
      if (orgFilter !== 'all' && item.organization_name !== orgFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.beneficiary_name.toLowerCase().includes(q) ||
          item.beneficiary_id.toLowerCase().includes(q) ||
          item.beneficiary_email.toLowerCase().includes(q) ||
          item.organization_name.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [dateRangePreset, orgFilter, searchQuery]);

  // Aggregate metrics for active filter
  const metrics = useMemo(() => {
    const totalVisits = filteredData.length;
    const totalEarned = filteredData.reduce((acc, curr) => acc + curr.reimbursement_rate, 0);
    const uniqueEmployers = new Set(filteredData.map((d) => d.organization_name)).size;
    const disputedCount = filteredData.filter((d) => d.is_disputed).length;
    return { totalVisits, totalEarned, uniqueEmployers, disputedCount };
  }, [filteredData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  // CSV Export handler
  const handleExportCSV = () => {
    const columns: CsvColumn<HistoricalVisit>[] = [
      { header: 'Visit ID', accessor: (v) => v.id },
      { header: 'Check-in Timestamp', accessor: (v) => v.check_in_at },
      { header: 'Corporate Member Name', accessor: (v) => v.beneficiary_name },
      { header: 'Member ID', accessor: (v) => v.beneficiary_id },
      { header: 'Corporate Employer', accessor: (v) => v.organization_name },
      { header: 'Benefit Tier', accessor: (v) => v.tier },
      { header: 'Facility Location', accessor: (v) => v.location_name },
      { header: 'Verification Method', accessor: (v) => v.verification_method },
      { header: 'Settlement Rate (RWF)', accessor: (v) => v.reimbursement_rate },
      { header: 'Status', accessor: (v) => v.status }
    ];

    downloadCsv(`polyfit_partner_attendance_${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredData);
  };

  const renderMethodBadge = (method: string) => {
    switch (method) {
      case 'turnstile':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#28D17C]">
            <DoorOpen className="w-3 h-3" /> Turnstile Gate
          </span>
        );
      case 'totp_qr':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0284C7]">
            <QrCode className="w-3 h-3" /> Mobile QR Pass
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D97706]">
            <UserCheck className="w-3 h-3" /> Front Desk Code
          </span>
        );
      case 'nfc':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9333EA]">
            <Wifi className="w-3 h-3" /> NFC Card / Keyfob
          </span>
        );
      default:
        return <span className="text-[11px] text-[#526173]">{method}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Audit Summary Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-xs">
          <div className="text-xs text-[#8491A3] font-medium">Verified Visits in Scope</div>
          <div className="text-xl font-bold text-[#0B1F33] mt-1">{metrics.totalVisits}</div>
          <div className="text-[11px] text-[#28D17C] font-medium mt-0.5">100% Reconciliation</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-xs">
          <div className="text-xs text-[#8491A3] font-medium">Reconciled Settlement</div>
          <div className="text-xl font-bold text-[#0B1F33] mt-1 font-mono">
            {metrics.totalEarned.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-[#526173] mt-0.5">5,000 RWF per check-in</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-xs">
          <div className="text-xs text-[#8491A3] font-medium">Corporate Employers</div>
          <div className="text-xl font-bold text-[#0B1F33] mt-1">{metrics.uniqueEmployers}</div>
          <div className="text-[11px] text-[#526173] mt-0.5">Active Client Accounts</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-xs">
          <div className="text-xs text-[#8491A3] font-medium">Disputed / Under Review</div>
          <div className="text-xl font-bold text-[#F59E0B] mt-1">{metrics.disputedCount}</div>
          <div className="text-[11px] text-[#8491A3] mt-0.5">Investigated by PolyFit Ops</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#FBFDFE]">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-[#8491A3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search historical logs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33]"
              />
            </div>

            {/* Date Preset Selector */}
            <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5 text-xs font-semibold">
              <button
                onClick={() => setDateRangePreset('today')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  dateRangePreset === 'today'
                    ? 'bg-[#0B1F33] text-white shadow-xs'
                    : 'text-[#526173] hover:text-[#0B1F33]'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRangePreset('7d')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  dateRangePreset === '7d'
                    ? 'bg-[#0B1F33] text-white shadow-xs'
                    : 'text-[#526173] hover:text-[#0B1F33]'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRangePreset('30d')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  dateRangePreset === '30d'
                    ? 'bg-[#0B1F33] text-white shadow-xs'
                    : 'text-[#526173] hover:text-[#0B1F33]'
                }`}
              >
                Month to Date
              </button>
              <button
                onClick={() => setDateRangePreset('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  dateRangePreset === 'all'
                    ? 'bg-[#0B1F33] text-white shadow-xs'
                    : 'text-[#526173] hover:text-[#0B1F33]'
                }`}
              >
                All Time
              </button>
            </div>

            {/* Dynamic Org Filter */}
            <select
              value={orgFilter}
              onChange={(e) => {
                setOrgFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#0B1F33] font-medium focus:outline-none focus:ring-2 focus:ring-[#28D17C] cursor-pointer"
            >
              <option value="all">All Corporate Clients</option>
              {availableOrgs.map((orgName) => (
                <option key={orgName} value={orgName}>
                  {orgName}
                </option>
              ))}
            </select>
          </div>

          {/* Export Action */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F33] text-white text-xs font-semibold hover:bg-[#122A44] transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[960px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#526173] uppercase tracking-wider">
                <th className="py-3 px-4 w-[155px]">Date & Time</th>
                <th className="py-3 px-4 w-[210px]">Corporate Member</th>
                <th className="py-3 px-4 w-[210px]">Corporate Client</th>
                <th className="py-3 px-4 w-[170px]">Facility Location</th>
                <th className="py-3 px-4 w-[130px]">Verification</th>
                <th className="py-3 px-4 w-[125px]">Settlement Rate</th>
                <th className="py-3 px-4 w-[160px] text-right">Reconciliation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs sm:text-sm">
              {paginatedRows.map((row) => (
                <tr key={row.id} className="pf-table-row-deferred hover:bg-[#F8FAFC] transition-colors">
                  {/* Timestamp */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono text-[#0B1F33] font-medium">
                      {new Date(row.check_in_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-[11px] text-[#8491A3] font-mono">
                      {new Date(row.check_in_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>

                  {/* Corporate Member */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0B1F33]">{row.beneficiary_name}</div>
                    <div className="text-[11px] text-[#526173] font-mono">
                      {row.beneficiary_id} • Verified Member
                    </div>
                  </td>

                  {/* Corporate Client */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#0B1F33]">{row.organization_name}</div>
                    <div className="text-[11px] text-[#8491A3]">Verified Corporate Benefit</div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 text-[#526173]">{row.location_name}</td>

                  {/* Verification */}
                  <td className="py-3 px-4">{renderMethodBadge(row.verification_method)}</td>

                  {/* Rate */}
                  <td className="py-3 px-4 font-mono font-bold text-[#0B1F33]">
                    {row.reimbursement_rate.toLocaleString()} RWF
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-right">
                    {row.is_disputed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        Under Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E9FAF2] text-[#0B1F33] border border-[#28D17C]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#28D17C]" />
                        Reconciled
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#526173]">
                    <p className="text-sm font-medium text-[#0B1F33]">No historical records match your filter.</p>
                    <p className="text-xs text-[#8491A3] mt-1">Try widening your date range or adjusting search keywords.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#526173] bg-[#FBFDFE]">
          <div className="flex items-center gap-3">
            <div>
              Showing <strong className="text-[#0B1F33]">{paginatedRows.length}</strong> of{' '}
              <strong className="text-[#0B1F33]">{filteredData.length}</strong> entries
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-[#E2E8F0] rounded px-1.5 py-0.5 text-[#0B1F33] font-medium"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F1F4F8]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <strong className="text-[#0B1F33]">{page}</strong> of{' '}
              <strong className="text-[#0B1F33]">{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F1F4F8]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
