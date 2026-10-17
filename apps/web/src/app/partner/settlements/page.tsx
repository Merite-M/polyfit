'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  BarChart3,
  SlidersHorizontal,
  RefreshCw,
  Eye
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch } from '@/lib/api-client';
import { formatRwf } from '@/lib/invoice-pdf';
import { generateSettlementPdf, SettlementPdfData } from '@/lib/settlement-pdf';
import { downloadCsv } from '@/lib/export-csv';
import { SettlementDetailDrawer } from '@/components/partner/settlements/SettlementDetailDrawer';

export default function PartnerSettlementsPage() {
  const { provider, dashboardData, openPayoutModal } = usePartner();

  const [statements, setStatements] = useState<SettlementPdfData[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<SettlementPdfData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'processing' | 'pending'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch settlements from live API
  const fetchSettlements = async () => {
    try {
      setIsRefreshing(true);
      const res = await apiFetch<{ settlements?: SettlementPdfData[] }>(
        `/api/settlements?limit=20`
      );
      setStatements(res?.settlements || []);
    } catch (err) {
      console.warn('[PartnerSettlements] Live settlements API notice:', err);
      setStatements([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleOpenDrawer = (stmt: SettlementPdfData) => {
    setSelectedStatement(stmt);
    setIsDrawerOpen(true);
  };

  const handleDownloadPdf = (e: React.MouseEvent, stmt: SettlementPdfData) => {
    e.stopPropagation();
    generateSettlementPdf(stmt);
  };

  const handleExportStatementsCsv = () => {
    downloadCsv(
      'polyfit-settlements-history.csv',
      [
        { header: 'Statement Number', accessor: (row) => row.statement_number || row.id },
        { header: 'Period Start', accessor: (row) => row.period_start },
        { header: 'Period End', accessor: (row) => row.period_end },
        { header: 'Total Visits', accessor: (row) => row.total_visits },
        { header: 'Gross Amount (RWF)', accessor: (row) => row.gross_amount },
        { header: 'Adjustments (RWF)', accessor: (row) => row.adjustments_amount || 0 },
        { header: 'Platform Share (RWF)', accessor: (row) => row.platform_fee_amount || Math.round(row.gross_amount * 0.1) },
        { header: 'Net Payout (RWF)', accessor: (row) => row.net_amount },
        { header: 'Payout Date', accessor: (row) => row.payout_date || 'Pending' },
        { header: 'Payment Reference', accessor: (row) => row.payment_reference || '-' },
        { header: 'Status', accessor: (row) => row.status.toUpperCase() }
      ],
      statements
    );
  };

  const filteredStatements = statements.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">Finance & Settlement Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight mt-1">
            Financial Settlements & Payouts
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Automated monthly visit reconciliations, bank & MoMo disbursements, and official RRA credit notes.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Link
            href="/partner/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F4F8] text-[#0B1F33] text-xs font-semibold border border-[#E2E8F0] transition-colors shadow-xs"
          >
            <BarChart3 className="w-4 h-4 text-[#008A4B]" />
            <span>4-Tab Reports Suite</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#8491A3] ml-0.5" />
          </Link>

          <button
            onClick={openPayoutModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-bold shadow-xs transition-all active:scale-98"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0B1F33]" />
            <span>Payout Settings</span>
          </button>

          <button
            onClick={fetchSettlements}
            title="Refresh settlements from backend"
            className="p-2 rounded-xl bg-white hover:bg-[#F1F4F8] text-[#526173] border border-[#E2E8F0] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#28D17C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Financial Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Accrued Earnings for Current Cycle */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8491A3]">
            <span>Accrued Earnings (Current Cycle)</span>
            <span className="text-[10px] font-bold text-[#008A4B] bg-[#E9FAF2] px-2 py-0.5 rounded-full border border-[#B7F1D2]">
              Active Cycle
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] font-mono mt-2">
            {formatRwf(dashboardData?.kpis?.estimated_mtd_revenue_rwf ?? 0)}{' '}
            <span className="text-xs font-sans text-[#8491A3]">RWF</span>
          </div>
          <div className="text-[11px] text-[#526173] mt-2 flex items-center justify-between">
            <span>
              {dashboardData?.kpis?.mtd_total_visits ?? 0} verified visits recorded
            </span>
            <span className="text-[#8491A3]">Reconciliation at Month-End</span>
          </div>
        </div>

        {/* Card 2: Next Scheduled Disbursement */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8491A3]">
            <span>Next Payout Disbursement</span>
            <Calendar className="w-4 h-4 text-[#28D17C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] mt-2 flex items-baseline gap-2">
            <span>15th of Next Month</span>
          </div>
          <div className="text-[11px] text-[#526173] mt-2 flex items-center justify-between">
            <span>Standard monthly cycle</span>
            <span className="text-[#D97706] font-semibold">Cut-off: 2nd of Month</span>
          </div>
        </div>

        {/* Card 3: Payout Account */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#8491A3]">
              <span>Payout Account</span>
              <button
                onClick={openPayoutModal}
                className="text-[11px] text-[#008A4B] font-bold hover:underline"
              >
                Change ✎
              </button>
            </div>
            <div className="text-base font-bold text-[#0B1F33] mt-2 truncate flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#28D17C] flex-shrink-0" />
              <span>{provider?.bank_details?.bank_name || 'No Bank Configured'}</span>
            </div>
            <div className="text-xs font-mono text-[#526173] mt-0.5">
              {provider?.bank_details?.account_number
                ? `${provider.bank_details.account_number} • RWF`
                : 'Configure in Payout Settings'}
            </div>
          </div>
          <div className="text-[11px] text-[#008A4B] font-semibold mt-2 pt-2 border-t border-[#E2E8F0] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>
              {provider?.tax_id
                ? `TIN: ${provider.tax_id} (RRA Verified)`
                : 'TIN: Unregistered (Add in Settings)'}
            </span>
          </div>
        </div>
      </div>

      {/* Wellhub/Gymlib Settlement Policy Reminder Banner */}
      <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
        <div className="p-2 rounded-xl bg-[#EDE9FE] text-[#7C3AED] shrink-0 mt-0.5">
          <Receipt className="w-5 h-5 text-[#7C3AED]" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs sm:text-sm font-bold text-[#5B21B6]">
              PolyFit Settlement Protocol & Rwanda Tax Compliance
            </h4>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] bg-white px-2 py-0.5 rounded-full border border-[#DDD6FE]">
              B2B Aggregator Standards
            </span>
          </div>
          <p className="text-xs text-[#6D28D9] mt-1 leading-relaxed">
            Monthly provider earnings close on the final calendar day of each month. In accordance with Wellhub and Gymlib partner benchmarks, all technical exceptions or retroactive visit claims must be submitted by the <strong>2nd day of the following month</strong>. Payouts are reconciled and disbursed via electronic funds transfer (EFT) or MTN MoMo Business Code on the <strong>15th of the month</strong>.
          </p>
        </div>
      </div>

      {/* Historical Settlements Reconciliation Table Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0B1F33] tracking-tight">
              Settlement Statements & Official Credit Notes
            </h3>
            <p className="text-xs text-[#526173] mt-0.5">
              Click any statement row for an itemized audit of corporate visits by client employer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Segmented Filter */}
            <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-[#0B1F33] shadow-xs font-bold' : 'text-[#526173]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === 'paid' ? 'bg-white text-[#0B1F33] shadow-xs font-bold' : 'text-[#526173]'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter('processing')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === 'processing' ? 'bg-white text-[#0B1F33] shadow-xs font-bold' : 'text-[#526173]'
                }`}
              >
                Processing
              </button>
            </div>

            <button
              onClick={handleExportStatementsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F1F4F8] text-[#0B1F33] font-semibold text-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00D2B4]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#526173] font-semibold border-b border-[#E2E8F0] whitespace-nowrap">
              <tr>
                <th className="py-3 px-4">Statement #</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Verified Visits</th>
                <th className="py-3 px-4 text-right">Gross (RWF)</th>
                <th className="py-3 px-4 text-right">Adjustments / Share</th>
                <th className="py-3 px-4 text-right">Net Payout (RWF)</th>
                <th className="py-3 px-4">Disbursement Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredStatements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#8491A3]">
                    No settlement statements found for this filter.
                  </td>
                </tr>
              ) : (
                filteredStatements.map((stmt) => (
                  <tr
                    key={stmt.id}
                    onClick={() => handleOpenDrawer(stmt)}
                    className="hover:bg-[#F7F9FC]/70 cursor-pointer transition-colors group whitespace-nowrap"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F33]">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-[#8491A3] group-hover:text-[#28D17C] transition-colors flex-shrink-0" />
                        <span>{stmt.statement_number || `PF-SET-${stmt.id.substring(0, 8).toUpperCase()}`}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#526173] font-medium">
                      {stmt.period_start} → {stmt.period_end}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#0B1F33]">
                      {stmt.total_visits}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#526173]">
                      {formatRwf(stmt.gross_amount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#8491A3]">
                      -{formatRwf((stmt.adjustments_amount || 0) + (stmt.platform_fee_amount || Math.round(stmt.gross_amount * 0.1)))}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#008A4B]">
                      {formatRwf(stmt.net_amount)}
                    </td>

                    <td className="py-3.5 px-4 text-[#526173]">
                      {stmt.payout_date || 'Pending'}
                    </td>

                    <td className="py-3.5 px-4">
                      {stmt.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008A4B] bg-[#E9FAF2] px-2 py-0.5 rounded-full border border-[#B7F1D2]">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : stmt.status === 'processing' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                          <Clock className="w-3 h-3" /> Processing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => handleDownloadPdf(e, stmt)}
                          title="Download Official PDF Credit Note"
                          className="p-1.5 rounded-lg text-[#526173] hover:text-[#0B1F33] hover:bg-[#E2E8F0] transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenDrawer(stmt)}
                          title="Audit visit breakdown"
                          className="p-1.5 rounded-lg text-[#526173] hover:text-[#0B1F33] hover:bg-[#E2E8F0] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Itemized Settlement Line Items Drawer */}
      <SettlementDetailDrawer
        statement={selectedStatement}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
