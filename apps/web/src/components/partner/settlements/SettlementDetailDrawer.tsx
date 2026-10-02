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
import { useDialog } from '@/lib/use-dialog';

interface SettlementDetailDrawerProps {
  statement: SettlementPdfData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SettlementDetailDrawer({ statement, isOpen, onClose }: SettlementDetailDrawerProps) {
  // Native <dialog> as an off-canvas drawer — uses pf-native-drawer CSS class
  // which positions inset: 0 0 0 auto and slides from the right.
  const dialogRef = useDialog(isOpen && !!statement, onClose);

  const handleDownloadPdf = () => {
    if (statement) generateSettlementPdf(statement);
  };

  const handleExportCsv = () => {
    if (!statement) return;
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
    paid: { bg: 'bg-accent-subtle', text: 'text-success', border: 'border-accent/20', icon: CheckCircle2, label: 'Paid & Disbursed' },
    processing: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', icon: Clock, label: 'Processing by Bank' },
    pending: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/30', icon: Clock, label: 'Pending Cycle Close' },
    disputed: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30', icon: AlertCircle, label: 'Dispute Under Review' }
  };

  const statusConfig = statement ? (statusColors[statement.status] || statusColors.paid) : statusColors.paid;
  const StatusIcon = statusConfig.icon;

  return (
    /* pf-native-drawer: positioned inset: 0 0 0 auto (right edge),
       slides in from right via @starting-style + allow-discrete transitions.
       This is the correct modern pattern for side-drawers — NOT a centered <dialog>. */
    <dialog
      ref={dialogRef}
      className="pf-native-drawer flex flex-col"
      aria-labelledby="settlement-drawer-title"
      onClose={onClose}
    >
      {/* Top Emerald Header Ribbon */}
      <div className="h-1.5 bg-gradient-to-r from-accent to-secondary shrink-0" />

      {/* Drawer Header */}
      <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              <StatusIcon className="w-3 h-3" />
              <span>{statusConfig.label}</span>
            </span>
            <span className="text-[11px] font-mono text-subdued">
              {statement?.statement_number || `PF-SET-${statement?.id.slice(0, 8).toUpperCase() || ''}`}
            </span>
          </div>
          <h2 id="settlement-drawer-title" className="text-xl font-bold text-primary tracking-tight mt-1">
            Settlement Statement Audit
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reconciled visit activity for period {statement?.period_start} to {statement?.period_end}.
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-subdued hover:text-primary hover:bg-muted transition-colors"
          aria-label="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      {statement && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Hero Net Payout Card */}
          <div className="bg-primary text-primary-foreground p-5 rounded-2xl border border-primary/80 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between text-xs text-primary-foreground/70">
              <span className="uppercase tracking-wider font-semibold">Net Disbursed Settlement</span>
              <span className="text-[10px] font-mono bg-primary-foreground/10 px-2 py-0.5 rounded border border-primary-foreground/20">
                EFT / MoMo
              </span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-primary-foreground mt-2">
              {formatRwf(statement.net_amount)}
            </div>
            <div className="flex items-center gap-3 text-xs text-primary-foreground/50 mt-2 pt-2 border-t border-primary-foreground/20">
              <span>Total Visits: <strong className="text-primary-foreground font-mono">{statement.total_visits}</strong></span>
              <span>•</span>
              <span>Trace: <strong className="text-primary-foreground font-mono">{statement.payment_reference || 'BK-FT-20260915-082'}</strong></span>
            </div>
          </div>

          {/* Payout Destination Info */}
          <div className="bg-muted p-4 rounded-xl border border-border space-y-2">
            <div className="text-[11px] font-bold text-subdued uppercase tracking-wider">
              Payout Destination
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Account Holder:</span>
              <span className="font-semibold text-primary">{statement.provider.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Disbursement Rail:</span>
              <span className="font-mono font-medium text-primary">
                {statement.provider.bank_details?.bank_name || 'Bank of Kigali (BK)'} ••••140-19
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Rwanda Revenue TIN:</span>
              <span className="font-mono text-success font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                {statement.provider.tax_id || '108392019'}
              </span>
            </div>
          </div>

          {/* Reconciliation By Client Organization */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                Employer Client Visit Breakdown
              </h3>
              <span className="text-[11px] text-subdued">
                Contract Rate: 5,000 RWF / visit
              </span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Organization</th>
                    <th className="py-2.5 px-3 text-right">Visits</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(statement.line_items && statement.line_items.length > 0
                    ? statement.line_items
                    : [
                        { org_name: 'Bank of Kigali Plc', visit_count: 205, per_visit_rate: 5000, subtotal: 1025000 },
                        { org_name: 'MTN Rwandacell', visit_count: 155, per_visit_rate: 5000, subtotal: 775000 },
                        { org_name: 'TechCorp Rwanda', visit_count: 90, per_visit_rate: 5000, subtotal: 450000 },
                        { org_name: 'I&M Bank Rwanda', visit_count: 40, per_visit_rate: 5000, subtotal: 200000 }
                      ]
                  ).map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-primary">{item.org_name}</p>
                        <p className="text-[10px] text-subdued">{item.category || 'Executive Fitness'}</p>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-primary">
                        {item.visit_count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        {formatRwf(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Ledger Calculation */}
          <div className="bg-muted p-4 rounded-xl border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Gross Verified Visits ({statement.total_visits} @ 5,000 RWF):</span>
              <span className="font-mono text-primary">{formatRwf(statement.gross_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Dispute Deductions / Adjustments:</span>
              <span className="font-mono text-error">
                -{formatRwf(statement.adjustments_amount || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>PolyFit Network Platform Share (10%):</span>
              <span className="font-mono text-subdued">
                -{formatRwf(statement.platform_fee_amount || Math.round(statement.gross_amount * 0.1))}
              </span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between font-bold text-sm text-primary">
              <span>Total Net Payout:</span>
              <span className="font-mono text-success">{formatRwf(statement.net_amount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Footer Actions */}
      <div className="p-4 sm:p-5 border-t border-border bg-muted flex flex-wrap items-center justify-between gap-3 shrink-0">
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-primary font-semibold text-xs transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-secondary" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs shadow-xs transition-all active:scale-98"
        >
          <Download className="w-4 h-4" />
          <span>Download Official Credit Note (PDF)</span>
        </button>
      </div>
    </dialog>
  );
}
