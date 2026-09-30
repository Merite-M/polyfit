'use client';

import React from 'react';
import {
  X,
  Receipt,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { formatRwf } from '@/lib/invoice-pdf';
import { generateSettlementPdf, SettlementPdfData } from '@/lib/settlement-pdf';
import { downloadCsv } from '@/lib/export-csv';

interface SettlementDetailDrawerProps {
  statement: SettlementPdfData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SettlementDetailDrawer({ statement, isOpen, onClose }: SettlementDetailDrawerProps) {
  if (!isOpen || !statement) return null;

  const handleDownloadPdf = () => {
    generateSettlementPdf(statement);
  };

  const handleExportCsv = () => {
    const items = statement.line_items || [];
    downloadCsv(
      `polyfit-settlement-${statement.statement_number || statement.id}.csv`,
      [
        { header: 'Statement ID', accessor: () => statement.statement_number || statement.id },
        { header: 'Period Start', accessor: () => statement.period_start },
        { header: 'Period End', accessor: () => statement.period_end },
        { header: 'Client Organization', accessor: (row) => row.org_name },
        { header: 'Category', accessor: (row) => row.category || 'General Access' },
        { header: 'Verified Visits', accessor: (row) => row.visit_count },
        { header: 'Contract Rate (RWF)', accessor: (row) => row.per_visit_rate },
        { header: 'Subtotal (RWF)', accessor: (row) => row.subtotal }
      ],
      items
    );
  };

  const statusColors = {
    paid: { bg: 'bg-[#E9FAF2]', text: 'text-[#008A4B]', border: 'border-[#B7F1D2]', icon: CheckCircle2, label: 'Paid & Disbursed' },
    processing: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FDE68A]', icon: Clock, label: 'Processing by Bank' },
    pending: { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#BFDBFE]', icon: Clock, label: 'Pending Cycle Close' },
    disputed: { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', border: 'border-[#FECACA]', icon: AlertCircle, label: 'Dispute Under Review' }
  };

  const statusConfig = statusColors[statement.status] || statusColors.paid;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1F33]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-[#E2E8F0] flex flex-col z-10 animate-in slide-in-from-right duration-200">
          {/* Top Emerald Header Ribbon */}
          <div className="h-1.5 bg-gradient-to-r from-[#28D17C] to-[#00D2B4]" />

          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span>{statusConfig.label}</span>
                </span>
                <span className="text-[11px] font-mono text-[#8491A3]">
                  {statement.statement_number || `PF-SET-${statement.id.slice(0, 8).toUpperCase()}`}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#0B1F33] tracking-tight mt-1">
                Settlement Statement Audit
              </h2>
              <p className="text-xs text-[#526173] mt-0.5">
                Reconciled visit activity for period {statement.period_start} to {statement.period_end}.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8491A3] hover:text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Hero Net Payout Card */}
            <div className="bg-[#0B1F33] text-white p-5 rounded-2xl border border-[#21405A] relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#DAE9E2]">
                <span className="uppercase tracking-wider font-semibold">Net Disbursed Settlement</span>
                <span className="text-[10px] font-mono bg-[#142C44] px-2 py-0.5 rounded border border-[#21405A]">
                  EFT / MoMo
                </span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-white mt-2">
                {formatRwf(statement.net_amount)}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#8491A3] mt-2 pt-2 border-t border-[#21405A]">
                <span>Total Visits: <strong className="text-white font-mono">{statement.total_visits}</strong></span>
                <span>•</span>
                <span>Trace: <strong className="text-white font-mono">{statement.payment_reference || 'BK-FT-20260915-082'}</strong></span>
              </div>
            </div>

            {/* Payout Destination Info */}
            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
              <div className="text-[11px] font-bold text-[#8491A3] uppercase tracking-wider">
                Payout Destination
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#526173]">Account Holder:</span>
                <span className="font-semibold text-[#0B1F33]">{statement.provider.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#526173]">Disbursement Rail:</span>
                <span className="font-mono font-medium text-[#0B1F33]">
                  {statement.provider.bank_details?.bank_name || 'Bank of Kigali (BK)'} ••••140-19
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#526173]">Rwanda Revenue TIN:</span>
                <span className="font-mono text-[#008A4B] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#28D17C]" />
                  {statement.provider.tax_id || '108392019'}
                </span>
              </div>
            </div>

            {/* Reconciliation By Client Organization */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider">
                  Employer Client Visit Breakdown
                </h3>
                <span className="text-[11px] text-[#8491A3]">
                  Contract Rate: 5,000 RWF / visit
                </span>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F9FC] text-[#526173] font-semibold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-2.5 px-3">Organization</th>
                      <th className="py-2.5 px-3 text-right">Visits</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {(statement.line_items && statement.line_items.length > 0
                      ? statement.line_items
                      : [
                          { org_name: 'Bank of Kigali Plc', visit_count: 205, per_visit_rate: 5000, subtotal: 1025000 },
                          { org_name: 'MTN Rwandacell', visit_count: 155, per_visit_rate: 5000, subtotal: 775000 },
                          { org_name: 'TechCorp Rwanda', visit_count: 90, per_visit_rate: 5000, subtotal: 450000 },
                          { org_name: 'I&M Bank Rwanda', visit_count: 40, per_visit_rate: 5000, subtotal: 200000 }
                        ]
                    ).map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#F7F9FC]/60 transition-colors">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-[#0B1F33]">{item.org_name}</p>
                          <p className="text-[10px] text-[#8491A3]">{item.category || 'Executive Fitness'}</p>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-[#0B1F33]">
                          {item.visit_count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0B1F33]">
                          {formatRwf(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Ledger Calculation */}
            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#526173]">
                <span>Gross Verified Visits ({statement.total_visits} @ 5,000 RWF):</span>
                <span className="font-mono text-[#0B1F33]">{formatRwf(statement.gross_amount)}</span>
              </div>
              <div className="flex items-center justify-between text-[#526173]">
                <span>Dispute Deductions / Adjustments:</span>
                <span className="font-mono text-[#EF4444]">
                  -{formatRwf(statement.adjustments_amount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#526173]">
                <span>PolyFit Network Platform Share (10%):</span>
                <span className="font-mono text-[#8491A3]">
                  -{formatRwf(statement.platform_fee_amount || Math.round(statement.gross_amount * 0.1))}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between font-bold text-sm text-[#0B1F33]">
                <span>Total Net Payout:</span>
                <span className="font-mono text-[#008A4B]">{formatRwf(statement.net_amount)}</span>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-[#F7F9FC] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F1F4F8] text-[#0B1F33] font-semibold text-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00D2B4]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs shadow-xs transition-all active:scale-98"
            >
              <Download className="w-4 h-4 text-[#0B1F33]" />
              <span>Download Official Credit Note (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
