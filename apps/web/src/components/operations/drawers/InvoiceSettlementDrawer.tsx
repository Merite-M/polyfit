"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Coins,
  Building2,
  Network,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Loader2,
  Layers,
  Banknote,
  Smartphone,
  Tag,
  Percent,
  PlusCircle,
  FileCheck,
  RotateCcw
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";
import { generateInvoicePdf, formatRwf } from "@/lib/invoice-pdf";
import { generateSettlementPdf } from "@/lib/settlement-pdf";
import { CreditNoteModal } from "@/components/operations/finance/CreditNoteModal";

export interface InvoiceSettlementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "invoice" | "settlement";
  entityId: string | null;
  initialData?: Record<string, any>;
  onEntityUpdated?: () => void;
}

export function InvoiceSettlementDrawer({
  isOpen,
  onClose,
  entityType,
  entityId,
  initialData,
  onEntityUpdated,
}: InvoiceSettlementDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { openDrawer } = useOperationsDrawer();

  const [record, setRecord] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Credit Note Modal state
  const [isCreditNoteOpen, setIsCreditNoteOpen] = useState(false);

  // Disburse modal inline state
  const [disbursementRef, setDisbursementRef] = useState("");
  const [showDisburseInput, setShowDisburseInput] = useState(false);

  // Fetch full details
  const fetchDetails = async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      if (entityType === "invoice") {
        const res = await apiFetch<any>(`/api/operations/finance/invoices?q=${entityId}`);
        if (res?.invoices && res.invoices.length > 0) {
          const found = res.invoices.find((i: any) => i.id === entityId) || res.invoices[0];
          setRecord(found);
        } else if (initialData) {
          setRecord(initialData);
        }
      } else {
        const res = await apiFetch<any>(`/api/operations/finance/settlements?q=${entityId}`);
        if (res?.settlements && res.settlements.length > 0) {
          const found = res.settlements.find((s: any) => s.id === entityId) || res.settlements[0];
          setRecord(found);
        } else if (initialData) {
          setRecord(initialData);
        }
      }
    } catch (err: any) {
      console.error("[InvoiceSettlementDrawer] Fetch error:", err);
      if (!record) setError(`Failed to fetch ${entityType} details.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && entityId) {
      setSuccessMessage(null);
      setError(null);
      setShowDisburseInput(false);
      setDisbursementRef("");
      fetchDetails();
    }
  }, [isOpen, entityId, entityType]);

  // Dialog lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  // Actions for Invoice
  const handleUpdateInvoiceStatus = async (newStatus: string) => {
    if (!record?.id) return;
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch<any>(`/api/operations/finance/invoices/${record.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccessMessage(`Invoice successfully updated to ${newStatus.toUpperCase()}`);
      await fetchDetails();
      if (onEntityUpdated) onEntityUpdated();
    } catch (err: any) {
      setError(err?.message || "Failed to update invoice status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoicePdf = () => {
    if (!record) return;
    try {
      const pdfData = {
        id: record.id,
        invoice_number: record.invoice_number || `INV-${record.id.slice(0, 8)}`,
        billing_period_start: record.billing_period_start || record.created_at,
        billing_period_end: record.billing_period_end || record.due_date || record.created_at,
        total_visits: record.total_visits || 0,
        total_amount: Number(record.total_amount) || 0,
        tax_amount: Number(record.tax_amount) || 0,
        status: record.status || "draft",
        due_date: record.due_date,
        paid_at: record.paid_at,
        created_at: record.created_at,
        organizations: {
          name: record.organizations?.name || "Corporate Client",
          tax_id: record.organizations?.tax_id || null,
          billing_email: record.organizations?.billing_email || null,
          country: "Rwanda",
        },
        line_items: record.line_items?.map((li: any) => ({
          provider_name: li.description || "Corporate Wellness Benefit Access",
          visit_count: li.quantity || 1,
          per_visit_rate: Number(li.unit_price) || Number(record.total_amount) || 0,
          subtotal: Number(li.amount) || Number(record.total_amount) || 0,
        })) || [
          {
            provider_name: "Corporate Wellness Network Access & Verified Visits",
            visit_count: record.total_visits || 1,
            per_visit_rate: Math.round((Number(record.total_amount) || 0) / Math.max(1, record.total_visits || 1)),
            subtotal: Number(record.total_amount) - Number(record.tax_amount || 0),
          }
        ],
      };
      generateInvoicePdf(pdfData);
    } catch (err: any) {
      console.error("[InvoiceSettlementDrawer] PDF error:", err);
      setError("Failed to generate PDF document");
    }
  };

  // Actions for Settlement
  const handleApproveSettlement = async () => {
    if (!record?.id) return;
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch<any>(`/api/operations/finance/settlements/${record.id}/approve`, {
        method: "POST",
      });
      setSuccessMessage("Settlement statement approved for payout clearinghouse");
      await fetchDetails();
      if (onEntityUpdated) onEntityUpdated();
    } catch (err: any) {
      setError(err?.message || "Failed to approve settlement");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburseSettlement = async () => {
    if (!record?.id) return;
    if (!disbursementRef.trim()) {
      setError("Please provide a bank reference or MoMo transaction ID");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch<any>(`/api/operations/finance/settlements/${record.id}/disburse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_reference: disbursementRef.trim() }),
      });
      setSuccessMessage("Settlement marked disbursed with remittance reference");
      setShowDisburseInput(false);
      await fetchDetails();
      if (onEntityUpdated) onEntityUpdated();
    } catch (err: any) {
      setError(err?.message || "Failed to disburse settlement");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadSettlementPdf = () => {
    if (!record) return;
    try {
      const pdfData = {
        id: record.id,
        statement_number: `SETTLE-${record.id.slice(0, 8)}`,
        period_start: record.settlement_period_start || record.created_at,
        period_end: record.settlement_period_end || record.created_at,
        total_visits: record.total_visits || 0,
        gross_amount: Number(record.total_amount) || 0,
        adjustments_amount: 0,
        platform_fee_amount: 0,
        net_amount: Number(record.total_amount) || 0,
        status: (record.status === "disbursed" || record.status === "paid" ? "paid" : "pending") as any,
        payment_reference: record.payment_reference || undefined,
        created_at: record.created_at,
        provider: {
          name: record.providers?.name || "Wellness Provider Partner",
          category: record.providers?.category || "gym",
          tax_id: record.providers?.tax_id || null,
          settlement_email: record.providers?.settlement_email || null,
          bank_details: record.providers?.bank_details || null,
        },
        line_items: [
          {
            org_name: "PolyFit Corporate Network Beneficiaries",
            category: record.providers?.category || "fitness",
            visit_count: record.total_visits || 0,
            per_visit_rate: record.total_visits > 0 ? Math.round(Number(record.total_amount) / record.total_visits) : 3800,
            subtotal: Number(record.total_amount) || 0,
          }
        ],
      };
      generateSettlementPdf(pdfData);
    } catch (err: any) {
      console.error("[InvoiceSettlementDrawer] Statement PDF error:", err);
      setError("Failed to generate Settlement PDF statement");
    }
  };

  const isInvoice = entityType === "invoice";
  const orgName = record?.organizations?.name || "Corporate Employer";
  const providerName = record?.providers?.name || "Wellness Provider";

  return (
    <>
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        className="backdrop:bg-black/40 backdrop:backdrop-blur-xs bg-transparent p-0 m-0 w-full h-full max-w-none max-h-none border-none outline-none overflow-hidden"
      >
        <div className="w-full h-full flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 text-slate-100 h-full shadow-2xl flex flex-col border-l border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isInvoice
                    ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                  {isInvoice ? <FileText className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      {isInvoice ? "B2B Corporate Invoice" : "Provider Settlement Statement"}
                    </span>
                    {record?.status && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        record.status === "paid" || record.status === "disbursed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : record.status === "approved" || record.status === "sent"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : record.status === "overdue" || record.status === "failed"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {record.status}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                    {isInvoice
                      ? record?.invoice_number || `INV-${entityId?.slice(0, 8)}`
                      : `SETTLE-${entityId?.slice(0, 8)}`}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification / Alert Banners */}
            {error && (
              <div className="px-5 py-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading && !record ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                  <span className="text-xs">Fetching telemetry audit records...</span>
                </div>
              ) : (
                <>
                  {/* Entity Hero Card */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          {isInvoice ? "Billed Employer" : "Wellness Provider Beneficiary"}
                        </span>
                        <div className="flex items-center gap-2">
                          {isInvoice ? (
                            <Building2 className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Network className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className="text-base font-semibold text-white">
                            {isInvoice ? orgName : providerName}
                          </span>
                        </div>
                        {isInvoice && record?.organizations?.tax_id && (
                          <div className="text-xs text-slate-400 font-mono">
                            RRA TIN: {record.organizations.tax_id}
                          </div>
                        )}
                        {!isInvoice && record?.providers?.tax_id && (
                          <div className="text-xs text-slate-400 font-mono">
                            TIN: {record.providers.tax_id} • Category: {record.providers.category?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (isInvoice && record?.org_id) {
                            openDrawer("organization", record.org_id);
                          } else if (!isInvoice && record?.provider_id) {
                            openDrawer("provider", record.provider_id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition"
                      >
                        <span>Inspect Dossier</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>

                    {/* Financial Spread Banner */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                          {isInvoice ? "Total Invoiced (incl. VAT)" : "Net Payable Amount"}
                        </span>
                        <span className="text-xl font-bold font-mono text-white">
                          {record?.total_amount ? Number(record.total_amount).toLocaleString() : "0"} <span className="text-xs font-sans text-slate-400">RWF</span>
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                          {isInvoice ? "Rwanda 18% VAT Collected" : "Verified Beneficiary Visits"}
                        </span>
                        {isInvoice ? (
                          <span className="text-lg font-bold font-mono text-indigo-300">
                            {record?.tax_amount ? Number(record.tax_amount).toLocaleString() : "0"} <span className="text-xs font-sans text-slate-400">RWF</span>
                          </span>
                        ) : (
                          <span className="text-lg font-bold font-mono text-emerald-400">
                            {record?.total_visits || 0} <span className="text-xs font-sans text-slate-400">visits</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dispute Escrow Notice (For Settlements) */}
                  {!isInvoice && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">
                          Dispute Escrow Guard Active
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Any visits flagged with active disputes in the telemetric verification engine are automatically held in escrow. Payouts are computed solely on 100% verified beneficiary sessions to guarantee zero cash leakage.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timeline & Metadata */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Accounting Cycle & Period</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Period Start</span>
                        <span className="text-slate-200 font-mono">
                          {record?.billing_period_start || record?.settlement_period_start || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Period End</span>
                        <span className="text-slate-200 font-mono">
                          {record?.billing_period_end || record?.settlement_period_end || "-"}
                        </span>
                      </div>
                      {isInvoice && (
                        <>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase">Payment Due Date</span>
                            <span className="text-slate-200 font-mono">{record?.due_date || "-"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase">Payment Settled At</span>
                            <span className="text-slate-200 font-mono">{record?.paid_at || "-"}</span>
                          </div>
                        </>
                      )}
                      {!isInvoice && record?.payment_reference && (
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[10px] uppercase">Remittance Reference</span>
                          <span className="text-emerald-400 font-mono font-medium">{record.payment_reference}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank / MoMo Settlement Destination (For Settlement) */}
                  {!isInvoice && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Banknote className="w-3.5 h-3.5 text-slate-400" />
                        <span>Payout Rail Destination</span>
                      </h3>
                      {record?.providers?.bank_details ? (
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase">Payout Method</span>
                            <span className="text-slate-200 font-semibold uppercase">
                              {record.providers.bank_details.payout_method || "EFT / MoMo"}
                            </span>
                          </div>
                          {record.providers.bank_details.bank_name && (
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">Bank Name</span>
                              <span className="text-slate-200">{record.providers.bank_details.bank_name}</span>
                            </div>
                          )}
                          {record.providers.bank_details.account_number && (
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">Account Number</span>
                              <span className="text-slate-200 font-mono">{record.providers.bank_details.account_number}</span>
                            </div>
                          )}
                          {record.providers.bank_details.momo_phone && (
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">MTN MoMo Number</span>
                              <span className="text-amber-400 font-mono">{record.providers.bank_details.momo_phone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No formal payout coordinates configured in provider KYC.</p>
                      )}
                    </div>
                  )}

                  {/* Line Items Breakdown (For Invoice) */}
                  {isInvoice && record?.line_items && record.line_items.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Invoice Line Items</span>
                      </h3>
                      <div className="space-y-2">
                        {record.line_items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-medium text-slate-200">{item.description || "Benefit Access"}</span>
                              <span className="text-[10px] text-slate-500 block font-mono">
                                Qty: {item.quantity || 1} • Unit: {Number(item.unit_price || 0).toLocaleString()} RWF
                              </span>
                            </div>
                            <span className="font-mono font-semibold text-white">
                              {Number(item.amount || 0).toLocaleString()} RWF
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inlined Disburse Input Prompt */}
                  {showDisburseInput && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                        Execute Settlement Disbursement
                      </h4>
                      <p className="text-xs text-slate-300">
                        Enter the bank wire confirmation reference or MTN MoMo batch ID:
                      </p>
                      <input
                        type="text"
                        value={disbursementRef}
                        onChange={(e) => setDisbursementRef(e.target.value)}
                        placeholder="e.g. BK-RTGS-994821 or MOMO-BULK-002"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDisburseInput(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDisburseSettlement}
                          disabled={actionLoading || !disbursementRef.trim()}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Confirm Disbursement
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
              {/* PDF Action */}
              <button
                type="button"
                onClick={isInvoice ? handleDownloadInvoicePdf : handleDownloadSettlementPdf}
                disabled={!record}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Download {isInvoice ? "RRA Tax PDF" : "Settlement Statement"}</span>
              </button>

              {/* Contextual Actions */}
              <div className="flex items-center gap-2">
                {isInvoice ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCreditNoteOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                      <span>Credit Note</span>
                    </button>
                    {record?.status !== "paid" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateInvoiceStatus("paid")}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Mark Paid</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {record?.status === "pending" && (
                      <button
                        type="button"
                        onClick={handleApproveSettlement}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                        <span>Approve For Payout</span>
                      </button>
                    )}
                    {record?.status === "approved" && !showDisburseInput && (
                      <button
                        type="button"
                        onClick={() => setShowDisburseInput(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Disburse Payout</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </dialog>

      {/* Credit Note Modal */}
      {isInvoice && record && (
        <CreditNoteModal
          isOpen={isCreditNoteOpen}
          onClose={() => setIsCreditNoteOpen(false)}
          invoice={record}
          onAdjustmentApplied={() => {
            fetchDetails();
            if (onEntityUpdated) onEntityUpdated();
          }}
        />
      )}
    </>
  );
}
